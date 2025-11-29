import { IsNotEmpty, IsString, IsOptional, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TestNotificationDto {
  @ApiProperty({
    description: 'FCM/Expo push token to send the test notification to',
    example: 'ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]',
  })
  @IsNotEmpty()
  @IsString()
  token: string;

  @ApiProperty({
    description: 'Notification title',
    example: 'Test Notification',
    default: 'Test Notification',
  })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({
    description: 'Notification body/message',
    example: 'This is a test notification from the API',
  })
  @IsNotEmpty()
  @IsString()
  body: string;

  @ApiPropertyOptional({
    description: 'Additional data payload',
    example: { test: true, timestamp: '2024-01-01T00:00:00Z' },
  })
  @IsOptional()
  @IsObject()
  data?: Record<string, unknown>;
}
