import { IsNotEmpty, IsString, IsOptional, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SendNotificationDto {
  @ApiProperty({
    description: 'FCM/APNs device token',
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
    example: 'high',
    enum: ['default', 'normal', 'high'],
    default: 'default',
  })
  @IsOptional()
  @IsString()
  priority?: 'default' | 'normal' | 'high';

  @ApiPropertyOptional({
    description: 'Android channel ID',
    example: 'default',
    default: 'default',
  })
  @IsOptional()
  @IsString()
  channelId?: string;
}

export class SendBulkNotificationDto {
  @ApiProperty({
    description: 'Array of device tokens',
    example: ['token1', 'token2'],
    type: [String],
  })
  @IsNotEmpty()
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
    description: 'Android channel ID',
    example: 'default',
    default: 'default',
  })
  @IsOptional()
  @IsString()
  channelId?: string;
}
