import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import OpenAI from 'openai';
import { v4 as uuidv4 } from 'uuid';
import { AiChatEntity, MessageRole } from './entities/ai-chat.entity';
import {
  SendMessageDto,
  ChatResponseDto,
  ConversationHistoryDto,
} from './dto/chat-message.dto';
import { MemberService } from 'src/member/member.service';
import { MemberEntity } from 'src/member/entities/member.entity';
import { GymService } from 'src/gym/gym.service';
import { GymEntity } from 'src/gym/entities/gym.entity';
import { ManagerService } from 'src/manager/manager.service';
import { ManagerEntity } from 'src/manager/manager.entity';
import { ReturnUserDto } from 'src/member/dto/return-user.dto';

// Interface for manager data with gym relations (extending the actual return type)
interface ManagerWithGyms {
  id: string;
  firstName: string;
  lastName: string;
  description?: string;
  shiftStartTime?: string;
  shiftEndTime?: string;
  ownedGyms?: GymEntity[];
  gyms?: GymEntity[];
  [key: string]: any; // Allow additional properties from returnManager
}

// Interface for member data (using the actual ReturnUserDto)
interface MemberWithGym extends ReturnUserDto {
  gymId?: string; // Add gymId for easier access
}

@Injectable()
export class AiChatService {
  private readonly logger = new Logger(AiChatService.name);
  private openai: OpenAI;

  constructor(
    @InjectRepository(AiChatEntity)
    private aiChatRepository: Repository<AiChatEntity>,
    private configService: ConfigService,
    private memberService: MemberService,
    private gymService: GymService,
    private managerService: ManagerService,
  ) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (!apiKey) {
      this.logger.warn(
        'OpenAI API key not found. AI chat features will be disabled.',
      );
    } else {
      this.openai = new OpenAI({
        apiKey,
      });
    }
  }

  async sendMessage(
    message: string,
    userId: string,
    userType: 'member' | 'manager',
    conversationId?: string,
    metadata?: Record<string, any>,
  ): Promise<ChatResponseDto> {
    if (!this.openai) {
      throw new BadRequestException('AI chat service is not configured');
    }

    // Generate or use existing conversation ID
    const currentConversationId = conversationId || uuidv4();

    try {
      // Validate conversation access if continuing an existing conversation
      if (conversationId) {
        const existingMessages = await this.getConversationHistory(
          conversationId,
          userId,
          userType,
        );
        if (existingMessages.length === 0) {
          throw new NotFoundException(
            'Conversation not found or access denied',
          );
        }
      }

      // Get conversation history if continuing an existing conversation
      const conversationHistory = conversationId
        ? await this.getConversationHistory(conversationId, userId, userType)
        : [];

      // Prepare messages for OpenAI
      const messages = this.prepareOpenAIMessages(message, conversationHistory);

      // Get user and gym information
      let member: MemberWithGym | null = null;
      let manager: ManagerWithGyms | null = null;
      let gym: GymEntity | null = null;

      if (userType === 'member') {
        try {
          const memberData = await this.memberService.getMe(userId);
          if (memberData) {
            member = memberData as MemberWithGym;
            // Get gymId from the gym object or use the gym object directly
            const gymId = member.gym?.id || member.gymId;
            if (gymId) {
              gym = await this.gymService.findOne(gymId);
            }
          }
        } catch (error) {
          this.logger.warn('Could not fetch member or gym information:', error);
        }
      } else if (userType === 'manager') {
        try {
          // For managers, we need to get the manager entity first
          const managerEntity = await this.managerService.getMe({
            id: userId,
          } as ManagerEntity);
          if (managerEntity) {
            manager = managerEntity as unknown as ManagerWithGyms;
            // Get the first owned gym or associated gym
            if (manager.ownedGyms && manager.ownedGyms.length > 0) {
              gym = await this.gymService.findOne(manager.ownedGyms[0].id);
            } else if (manager.gyms && manager.gyms.length > 0) {
              gym = await this.gymService.findOne(manager.gyms[0].id);
            }
          }
        } catch (error) {
          this.logger.warn(
            'Could not fetch manager or gym information:',
            error,
          );
        }
      }

      console.log(
        'this is the prompt',
        this.getFitnessSystemPrompt(member, manager, gym),
      );

      // Call OpenAI API
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: this.getFitnessSystemPrompt(member, manager, gym),
          },
          ...messages,
        ],
        max_completion_tokens: 512, // lowered from 4096 to save cost
        temperature: 0.7, // slightly lower for more focused answers
      });

      console.log(
        'this is the completion',
        JSON.stringify(completion.choices, null, 2),
      );
      const aiResponse =
        completion.choices[0]?.message?.content ||
        "I apologize, but I couldn't generate a response.";
      const usage = completion.usage;
      const cost = this.calculateCost(usage);

      // Save user message
      const userMessage = this.aiChatRepository.create({
        message,
        role: MessageRole.USER,
        conversationId: currentConversationId,
        metadata,
        tokensUsed: usage?.prompt_tokens || 0,
        cost: 0,
        ...(userType === 'member'
          ? { memberId: userId }
          : { managerId: userId }),
      });
      await this.aiChatRepository.save(userMessage);

      // Save AI response
      const aiMessage = this.aiChatRepository.create({
        message: aiResponse,
        role: MessageRole.ASSISTANT,
        conversationId: currentConversationId,
        metadata: { tokensUsed: usage?.completion_tokens, cost },
        tokensUsed: usage?.completion_tokens || 0,
        cost,
        ...(userType === 'member'
          ? { memberId: userId }
          : { managerId: userId }),
      });
      await this.aiChatRepository.save(aiMessage);

      return {
        message: aiResponse,
        conversationId: currentConversationId,
        role: MessageRole.ASSISTANT,
        createdAt: aiMessage.createdAt,
        tokensUsed: usage?.completion_tokens || 0,
        cost,
      };
    } catch (error) {
      this.logger.error('Error in AI chat:', error);
      throw new BadRequestException(
        'Failed to process your message. Please try again.',
      );
    }
  }

  private prepareOpenAIMessages(
    currentMessage: string,
    conversationHistory: AiChatEntity[],
  ): OpenAI.Chat.Completions.ChatCompletionMessageParam[] {
    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [];

    // Add conversation history
    conversationHistory.forEach((msg) => {
      messages.push({
        role: msg.role === MessageRole.USER ? 'user' : 'assistant',
        content: msg.message,
      });
    });

    // Add current message
    messages.push({
      role: 'user',
      content: currentMessage,
    });

    return messages;
  }

  private getFitnessSystemPrompt(
    member: MemberWithGym | null = null,
    manager: ManagerWithGyms | null = null,
    gym: GymEntity | null = null,
  ): string {
    let prompt = `You are a professional fitness and health AI assistant. 
Your role is to support gym members with short, practical guidance on workouts, nutrition, and safe exercise practices.

Guidelines:
- Be concise (aim for under 6 sentences per reply).
- Prioritize safety and injury prevention.
- Provide clear, actionable advice.
- Ask clarifying questions only if necessary.
- Encourage and motivate, but avoid long speeches.
- Do not generate lengthy workout programs unless explicitly requested.
- Consider the gym's facilities and services when giving advice.

`;

    // Add gym information
    if (gym) {
      prompt += `GYM INFORMATION:
`;
      prompt += `Name: ${gym.name}
`;
      if (gym.address)
        prompt += `Location: ${gym.address}
`;
      if (gym.description)
        prompt += `Description: ${gym.description}
`;
      if (gym.gymType)
        prompt += `Gym Type: ${gym.gymType}
`;
      if (gym.openingDays && gym.openingDays.length > 0) {
        prompt += `Operating Hours: ${gym.openingDays.map((day) => `${day.day}: ${day.isOpen ? day.openingTime + '-' + day.closingTime : 'Closed'}`).join(', ')}
`;
      }
      if (gym.offers && gym.offers.length > 0) {
        prompt += `Available Services: ${gym.offers.map((offer) => offer.description).join(', ')}
`;
      }
      prompt += `
`;
    }

    // Add user information
    if (member) {
      prompt += `MEMBER PROFILE:
`;
      prompt += `Name: ${member.name}
`;
      if (member.trainingLevel)
        prompt += `Training Level: ${member.trainingLevel}
`;
      if (member.trainingGoals)
        prompt += `Training Goals: ${member.trainingGoals}
`;
      if (member.trainingPreferences)
        prompt += `Training Preferences: ${member.trainingPreferences}
`;

      // Add health information if available
      const healthInfo = this.formatMemberHealthInfo(member);
      if (healthInfo) {
        prompt += `Health Information: ${healthInfo}
`;
      }

      prompt += `
Use this information to provide personalized fitness advice that aligns with the member's goals, level, and the gym's available facilities.
`;
    } else if (manager) {
      prompt += `MANAGER PROFILE:
`;
      prompt += `Name: ${manager.firstName} ${manager.lastName}
`;
      if (manager.description)
        prompt += `Description: ${manager.description}
`;
      if (manager.shiftStartTime && manager.shiftEndTime) {
        prompt += `Working Hours: ${manager.shiftStartTime} - ${manager.shiftEndTime}
`;
      }

      prompt += `
You are assisting a gym manager. Provide professional fitness and gym management advice.
`;
    }

    return prompt;
  }

  private formatMemberHealthInfo(member: MemberWithGym): string {
    const healthInfo = [];

    if (member.weight) healthInfo.push(`Weight: ${member.weight}kg`);
    if (member.height) healthInfo.push(`Height: ${member.height}cm`);
    if (member.bmi) healthInfo.push(`BMI: ${member.bmi}`);
    if (member.bodyFatPercentage)
      healthInfo.push(`Body Fat: ${member.bodyFatPercentage}%`);
    if (member.muscleMass)
      healthInfo.push(`Muscle Mass: ${member.muscleMass}kg`);
    if (member.bloodType) healthInfo.push(`Blood Type: ${member.bloodType}`);
    if (member.allergies) healthInfo.push(`Allergies: ${member.allergies}`);
    if (member.medicalConditions)
      healthInfo.push(`Medical Conditions: ${member.medicalConditions}`);
    if (member.medications)
      healthInfo.push(`Medications: ${member.medications}`);
    if (member.birthday) {
      const age =
        new Date().getFullYear() - new Date(member.birthday).getFullYear();
      healthInfo.push(`Age: ${age} years`);
    }

    return healthInfo.length > 0 ? healthInfo.join(', ') : '';
  }

  private calculateCost(usage: any): number {
    if (!usage) return 0;

    // GPT-4 pricing (approximate - adjust based on current OpenAI pricing)
    const inputCostPer1kTokens = 0.03; // $0.03 per 1K input tokens
    const outputCostPer1kTokens = 0.06; // $0.06 per 1K output tokens

    const inputCost = (usage.prompt_tokens / 1000) * inputCostPer1kTokens;
    const outputCost = (usage.completion_tokens / 1000) * outputCostPer1kTokens;

    return Math.round((inputCost + outputCost) * 10000) / 10000; // Round to 4 decimal places
  }

  async getConversationHistory(
    conversationId: string,
    userId?: string,
    userType?: 'member' | 'manager',
  ): Promise<AiChatEntity[]> {
    const whereCondition: any = { conversationId };

    // Filter by user if provided (for security)
    if (userId && userType) {
      if (userType === 'member') {
        whereCondition.memberId = userId;
      } else {
        whereCondition.managerId = userId;
      }
    }

    return this.aiChatRepository.find({
      where: whereCondition,
      order: { createdAt: 'ASC' },
    });
  }

  async getUserConversations(
    userId: string,
    userType: 'member' | 'manager',
    limit: number = 10,
    offset: number = 0,
  ): Promise<ConversationHistoryDto[]> {
    // First, get all conversations that the user has participated in
    const conversations = await this.aiChatRepository
      .createQueryBuilder('chat')
      .select('chat.conversationId')
      .addSelect('SUM(chat.tokensUsed)', 'totalTokens')
      .addSelect('SUM(chat.cost)', 'totalCost')
      .where(
        userType === 'member'
          ? 'chat.memberId = :userId'
          : 'chat.managerId = :userId',
        { userId },
      )
      .groupBy('chat.conversationId')
      .orderBy('MAX(chat.createdAt)', 'DESC')
      .limit(limit)
      .offset(offset)
      .getRawMany();

    const result: ConversationHistoryDto[] = [];

    console.log('conversations', conversations);

    for (const conv of conversations) {
      // Get all messages for this conversation, but only if the user has access to it
      // We need to verify the user has access to this conversation first
      const userMessages = await this.getConversationHistory(
        conv.chat_conversationId,
        userId,
        userType,
      );

      console.log('userMessages', userMessages.length);

      // If user has no messages in this conversation, skip it (security check)
      if (userMessages.length === 0) {
        continue;
      }

      // Now get ALL messages in this conversation (both user and AI messages)
      // This is safe because we've already verified the user has access
      const allMessages = await this.getConversationHistory(
        conv.chat_conversationId,
      );

      const chatMessages = allMessages.map((msg) => ({
        message: msg.message,
        conversationId: msg.conversationId,
        role: msg.role,
        createdAt: msg.createdAt,
        tokensUsed: msg.tokensUsed,
        cost: msg.cost,
      }));

      result.push({
        conversationId: conv.chat_conversationId,
        messages: chatMessages,
        totalTokensUsed: parseInt(conv.totalTokens) || 0,
        totalCost: parseFloat(conv.totalCost) || 0,
      });
    }

    return result;
  }

  async deleteConversation(
    conversationId: string,
    userId: string,
    userType: 'member' | 'manager',
  ): Promise<void> {
    const whereCondition =
      userType === 'member'
        ? { conversationId, memberId: userId }
        : { conversationId, managerId: userId };

    const result = await this.aiChatRepository.delete(whereCondition);

    if (result.affected === 0) {
      throw new NotFoundException('Conversation not found or access denied');
    }
  }

  async getChatStats(
    userId: string,
    userType: 'member' | 'manager',
  ): Promise<{
    totalConversations: number;
    totalMessages: number;
    totalTokensUsed: number;
    totalCost: number;
  }> {
    const stats = await this.aiChatRepository
      .createQueryBuilder('chat')
      .select('COUNT(DISTINCT chat.conversationId)', 'totalConversations')
      .addSelect('COUNT(*)', 'totalMessages')
      .addSelect('SUM(chat.tokensUsed)', 'totalTokensUsed')
      .addSelect('SUM(chat.cost)', 'totalCost')
      .where(
        userType === 'member'
          ? 'chat.memberId = :userId'
          : 'chat.managerId = :userId',
        { userId },
      )
      .getRawOne();

    return {
      totalConversations: parseInt(stats.totalConversations) || 0,
      totalMessages: parseInt(stats.totalMessages) || 0,
      totalTokensUsed: parseInt(stats.totalTokensUsed) || 0,
      totalCost: parseFloat(stats.totalCost) || 0,
    };
  }
}
