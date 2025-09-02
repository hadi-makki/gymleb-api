import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  IsEnum,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MessageRole } from '../entities/ai-chat.entity';

export class SendMessageDto {
  @ApiProperty({
    description: 'The message content from the user',
    example: 'Can you help me create a workout plan for weight loss?',
  })
  @IsString()
  @IsNotEmpty()
  message: string;

  @ApiPropertyOptional({
    description:
      'ID of the conversation (for continuing existing conversations)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID()
  conversationId?: string;

  @ApiPropertyOptional({
    description: 'Additional context or metadata for the AI',
    example: { fitnessLevel: 'beginner', goal: 'weight_loss' },
  })
  @IsOptional()
  metadata?: Record<string, any>;
}

export class ChatResponseDto {
  @ApiProperty({
    description: 'The AI response message',
    example: "I'd be happy to help you create a workout plan for weight loss!",
  })
  @IsString()
  @IsNotEmpty()
  message: string;

  @ApiProperty({
    description: 'ID of the conversation',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  conversationId: string;

  @ApiProperty({
    description: 'Role of the message sender',
    enum: MessageRole,
    example: MessageRole.ASSISTANT,
  })
  @IsEnum(MessageRole)
  role: MessageRole;

  @ApiProperty({
    description: 'Timestamp when the message was created',
    example: '2024-01-15T10:30:00Z',
  })
  createdAt: Date;

  @ApiPropertyOptional({
    description: 'Number of tokens used in the response',
    example: 150,
  })
  @IsOptional()
  tokensUsed?: number;

  @ApiPropertyOptional({
    description: 'Cost of the API call',
    example: 0.002,
  })
  @IsOptional()
  cost?: number;
}

export class ConversationHistoryDto {
  @ApiProperty({
    description: 'ID of the conversation',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  conversationId: string;

  @ApiProperty({
    description: 'Array of messages in the conversation',
    type: [ChatResponseDto],
  })
  messages: ChatResponseDto[];

  @ApiProperty({
    description: 'Total tokens used in the conversation',
    example: 450,
  })
  totalTokensUsed: number;

  @ApiProperty({
    description: 'Total cost of the conversation',
    example: 0.006,
  })
  totalCost: number;
}
