import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsObject,
  IsEnum,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { NotificationCategory } from '../entities/in-app-notification.entity';

export class SendTestNotificationDto {
  @ApiProperty({
    description: 'Member ID to send notification to',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsNotEmpty()
  @IsString()
  memberId: string;

  @ApiProperty({
    description: 'Notification title',
    example: 'Test Notification',
  })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty({
    description: 'Notification body',
    example: 'This is a test notification',
  })
  @IsNotEmpty()
  @IsString()
  body: string;

  @ApiPropertyOptional({
    description: 'Notification category',
    enum: NotificationCategory,
    example: NotificationCategory.GENERAL,
  })
  @IsOptional()
  @IsEnum(NotificationCategory)
  category?: NotificationCategory;

  @ApiPropertyOptional({
    description: 'Additional data payload',
    example: { screen: 'notifications', test: true },
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
    example: 'normal',
    enum: ['default', 'normal', 'high'],
    default: 'normal',
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

  @ApiPropertyOptional({
    description: 'Gym ID (optional)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsString()
  gymId?: string;
}
