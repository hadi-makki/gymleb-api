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
    description: 'Expo push token',
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
