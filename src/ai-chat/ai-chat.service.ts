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

@Injectable()
export class AiChatService {
  private readonly logger = new Logger(AiChatService.name);
  private openai: OpenAI;

  constructor(
    @InjectRepository(AiChatEntity)
    private aiChatRepository: Repository<AiChatEntity>,
    private configService: ConfigService,
    private memberService: MemberService,
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
      // Get conversation history if continuing an existing conversation
      const conversationHistory = conversationId
        ? await this.getConversationHistory(conversationId)
        : [];

      // Prepare messages for OpenAI
      const messages = this.prepareOpenAIMessages(message, conversationHistory);

      // Get member training preferences if user is a member
      let memberTrainingInfo = '';
      if (userType === 'member') {
        try {
          const member = await this.memberService.getMe(userId);
          if (member) {
            memberTrainingInfo = this.formatMemberTrainingInfo(member);
          }
        } catch (error) {
          this.logger.warn(
            'Could not fetch member training preferences:',
            error,
          );
        }
      }

      // Call OpenAI API
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: this.getFitnessSystemPrompt(memberTrainingInfo),
          },
          ...messages,
        ],
        max_completion_tokens: 5000,
        temperature: 1,
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

  private getFitnessSystemPrompt(memberTrainingInfo: string = ''): string {
    let prompt = `You are a professional fitness and health AI assistant. Your role is to help users with:

1. **Workout Plans**: Create personalized workout routines based on fitness level, goals, and available equipment
2. **Nutrition Advice**: Provide healthy eating tips, meal planning, and dietary recommendations
3. **Exercise Form**: Explain proper technique for various exercises to prevent injury
4. **Fitness Goals**: Help users set realistic and achievable fitness objectives
5. **Recovery**: Advise on rest days, stretching, and recovery techniques
6. **Motivation**: Provide encouragement and tips to stay consistent with fitness routines

IMPORTANT GUIDELINES:
- Always prioritize safety and injury prevention
- Recommend consulting healthcare professionals for medical concerns
- Provide specific, actionable advice
- Consider the user's fitness level and experience
- Be encouraging and supportive
- Keep responses concise but informative
- Ask clarifying questions when needed to provide better advice

Remember: You're here to support and guide users on their fitness journey while promoting safe and effective practices.`;

    if (memberTrainingInfo) {
      prompt += `\n\nUSER TRAINING PROFILE:\n${memberTrainingInfo}\n\nUse this information to provide more personalized and relevant advice.`;
    }

    return prompt;
  }

  private formatMemberTrainingInfo(member: any): string {
    const info = [];

    info.push(`Name: ${member.name}`);
    if (member.trainingLevel) {
      info.push(`Training Level: ${member.trainingLevel}`);
    }
    if (member.trainingGoals) {
      info.push(`Training Goals: ${member.trainingGoals}`);
    }
    if (member.trainingPreferences) {
      info.push(`Training Preferences: ${member.trainingPreferences}`);
    }

    return info.length > 0 ? info.join('\n') : 'No training preferences set';
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
  ): Promise<AiChatEntity[]> {
    return this.aiChatRepository.find({
      where: { conversationId },
      order: { createdAt: 'ASC' },
    });
  }

  async getUserConversations(
    userId: string,
    userType: 'member' | 'manager',
    limit: number = 10,
    offset: number = 0,
  ): Promise<ConversationHistoryDto[]> {
    const conversations = await this.aiChatRepository
      .createQueryBuilder('chat')
      .select('chat.conversationId')
      .addSelect('COUNT(*)', 'messageCount')
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

    for (const conv of conversations) {
      const messages = await this.getConversationHistory(conv.conversationId);
      const chatMessages = messages.map((msg) => ({
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
