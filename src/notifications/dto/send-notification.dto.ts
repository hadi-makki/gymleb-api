import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsObject,
  IsArray,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SendExpoNotificationDto {
  @ApiProperty({
    description: 'Member ID to send notification to',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsNotEmpty()
  @IsString()
  memberId: string;

  @ApiProperty({
    description: 'Expo push token to send the notification to',
    example: 'ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]',
  })
  @IsNotEmpty()
  @IsString()
  token: string;

  @ApiProperty({
    description: 'Notification title',
    example: 'New Message',
  })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty({
    description: 'Notification body',
    example: 'You have a new message',
  })
  @IsNotEmpty()
  @IsString()
  body: string;

  @ApiPropertyOptional({
    description: 'Notification category',
    enum: [
      'payment',
      'subscription',
      'expiry',
      'renewal',
      'reminder',
      'general',
      'pt_session',
    ],
    example: 'general',
  })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({
    description: 'Additional data payload',
    example: { screen: 'chat', userId: '123' },
  })
  @IsOptional()
  @IsObject()
  data?: Record<string, unknown>;

  @ApiPropertyOptional({
    description: 'Sound to play',
    example: 'default',
    default: 'default',
  })
  @IsOptional()
  @IsString()
  sound?: string;

  @ApiPropertyOptional({
    description: 'Notification priority',
    example: 'default',
    enum: ['default', 'normal', 'high'],
    default: 'default',
  })
  @IsOptional()
  @IsString()
  priority?: 'default' | 'normal' | 'high';

  @ApiPropertyOptional({
    description: 'Badge count',
    example: 1,
  })
  @IsOptional()
  badge?: number;
}

export class SendBulkExpoNotificationDto {
  @ApiProperty({
    description: 'Array of Expo push tokens',
    example: ['ExponentPushToken[xxx]', 'ExponentPushToken[yyy]'],
    type: [String],
  })
  @IsNotEmpty()
  @IsArray()
  @IsString({ each: true })
  tokens: string[];

  @ApiProperty({
    description: 'Notification title',
    example: 'New Message',
  })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty({
    description: 'Notification body',
    example: 'You have a new message',
  })
  @IsNotEmpty()
  @IsString()
  body: string;

  @ApiPropertyOptional({
    description: 'Additional data payload',
    example: { screen: 'chat', userId: '123' },
  })
  @IsOptional()
  @IsObject()
  data?: Record<string, unknown>;

  @ApiPropertyOptional({
    description: 'Sound to play',
    example: 'default',
    default: 'default',
  })
  @IsOptional()
  @IsString()
  sound?: string;

  @ApiPropertyOptional({
    description: 'Notification priority',
    example: 'default',
    enum: ['default', 'normal', 'high'],
    default: 'default',
  })
  @IsOptional()
  @IsString()
  priority?: 'default' | 'normal' | 'high';

  @ApiPropertyOptional({
    description: 'Badge count',
    example: 1,
  })
  @IsOptional()
  badge?: number;
}
