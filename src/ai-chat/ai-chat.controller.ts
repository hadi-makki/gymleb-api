import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { AiChatService } from './ai-chat.service';
import {
  SendMessageDto,
  ChatResponseDto,
  ConversationHistoryDto,
} from './dto/chat-message.dto';
import { ManagerAuthGuard } from '../guards/manager-auth.guard';
import { AuthGuard } from 'src/guards/auth.guard';

@ApiTags('AI Chat')
@Controller('ai-chat')
@UseGuards(AuthGuard)
@ApiBearerAuth()
export class AiChatController {
  constructor(private readonly aiChatService: AiChatService) {}

  @Post('send-message')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Send a message to the AI fitness assistant',
    description:
      'Send a message and receive an AI response about fitness, workouts, nutrition, etc.',
  })
  @ApiResponse({
    status: 200,
    description: 'Message sent successfully',
    type: ChatResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request or AI service not configured',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async sendMessage(
    @Body() sendMessageDto: SendMessageDto,
    @Request() req: any,
  ): Promise<ChatResponseDto> {
    const userId = req.user.id;
    const userType = req.user.role === 'manager' ? 'manager' : 'member';

    return this.aiChatService.sendMessage(
      sendMessageDto.message,
      userId,
      userType,
      sendMessageDto.conversationId,
      sendMessageDto.metadata,
    );
  }

  @Get('conversations')
  @ApiOperation({
    summary: 'Get user conversation history',
    description: 'Retrieve all conversations for the authenticated user',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Number of conversations to return (default: 10)',
    type: Number,
  })
  @ApiQuery({
    name: 'offset',
    required: false,
    description: 'Number of conversations to skip (default: 0)',
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Conversations retrieved successfully',
    type: [ConversationHistoryDto],
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async getUserConversations(
    @Query('limit') limit: number = 10,
    @Query('offset') offset: number = 0,
    @Request() req: any,
  ): Promise<ConversationHistoryDto[]> {
    const userId = req.user.id;
    const userType = req.user.role === 'manager' ? 'manager' : 'member';

    return this.aiChatService.getUserConversations(
      userId,
      userType,
      limit,
      offset,
    );
  }

  @Get('conversations/:conversationId')
  @ApiOperation({
    summary: 'Get specific conversation history',
    description: 'Retrieve all messages from a specific conversation',
  })
  @ApiParam({
    name: 'conversationId',
    description: 'ID of the conversation to retrieve',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Conversation retrieved successfully',
    type: ConversationHistoryDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 404,
    description: 'Conversation not found',
  })
  async getConversationHistory(
    @Param('conversationId') conversationId: string,
    @Request() req: any,
  ): Promise<ConversationHistoryDto> {
    const userId = req.user.id;
    const userType = req.user.role === 'manager' ? 'manager' : 'member';

    const messages =
      await this.aiChatService.getConversationHistory(conversationId);

    if (messages.length === 0) {
      return {
        conversationId,
        messages: [],
        totalTokensUsed: 0,
        totalCost: 0,
      };
    }

    // Verify user has access to this conversation
    const firstMessage = messages[0];
    if (
      (userType === 'member' && firstMessage.memberId !== userId) ||
      (userType === 'manager' && firstMessage.managerId !== userId)
    ) {
      throw new Error('Access denied to this conversation');
    }

    const chatMessages = messages.map((msg) => ({
      message: msg.message,
      conversationId: msg.conversationId,
      role: msg.role,
      createdAt: msg.createdAt,
      tokensUsed: msg.tokensUsed,
      cost: msg.cost,
    }));

    const totalTokensUsed = messages.reduce(
      (sum, msg) => sum + msg.tokensUsed,
      0,
    );
    const totalCost = messages.reduce((sum, msg) => sum + msg.cost, 0);

    return {
      conversationId,
      messages: chatMessages,
      totalTokensUsed,
      totalCost,
    };
  }

  @Delete('conversations/:conversationId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete a conversation',
    description: 'Permanently delete a conversation and all its messages',
  })
  @ApiParam({
    name: 'conversationId',
    description: 'ID of the conversation to delete',
    type: String,
  })
  @ApiResponse({
    status: 204,
    description: 'Conversation deleted successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 404,
    description: 'Conversation not found or access denied',
  })
  async deleteConversation(
    @Param('conversationId') conversationId: string,
    @Request() req: any,
  ): Promise<void> {
    const userId = req.user.id;
    const userType = req.user.role === 'manager' ? 'manager' : 'member';

    await this.aiChatService.deleteConversation(
      conversationId,
      userId,
      userType,
    );
  }

  @Get('stats')
  @ApiOperation({
    summary: 'Get chat statistics',
    description: 'Retrieve usage statistics for the authenticated user',
  })
  @ApiResponse({
    status: 200,
    description: 'Statistics retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        totalConversations: { type: 'number' },
        totalMessages: { type: 'number' },
        totalTokensUsed: { type: 'number' },
        totalCost: { type: 'number' },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async getChatStats(@Request() req: any): Promise<{
    totalConversations: number;
    totalMessages: number;
    totalTokensUsed: number;
    totalCost: number;
  }> {
    const userId = req.user.id;
    const userType = req.user.role === 'manager' ? 'manager' : 'member';

    return this.aiChatService.getChatStats(userId, userType);
  }

  @Post('send-message/manager')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ManagerAuthGuard)
  @ApiOperation({
    summary: 'Send a message as a manager (protected route)',
    description:
      'Send a message to the AI fitness assistant with manager privileges',
  })
  @ApiResponse({
    status: 200,
    description: 'Message sent successfully',
    type: ChatResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request or AI service not configured',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - manager access required',
  })
  async sendMessageAsManager(
    @Body() sendMessageDto: SendMessageDto,
    @Request() req: any,
  ): Promise<ChatResponseDto> {
    const userId = req.user.id;

    return this.aiChatService.sendMessage(
      sendMessageDto.message,
      userId,
      'manager',
      sendMessageDto.conversationId,
      sendMessageDto.metadata,
    );
  }
}
