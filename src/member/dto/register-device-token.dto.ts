import { IsNotEmpty, IsString, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum Platform {
  IOS = 'ios',
  ANDROID = 'android',
  WEB = 'web',
}

export enum TokenType {
  NATIVE = 'native', // FCM for Android, APNs for iOS
  EXPO = 'expo', // Expo Push Notification Service
}

export class RegisterDeviceTokenDto {
  @ApiProperty({
    description: 'FCM/APNs/Expo push token for the device',
    example: 'ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]',
  })
  @IsNotEmpty()
  @IsString()
  token: string;

  @ApiProperty({
    description: 'Platform of the device',
    enum: Platform,
    example: Platform.ANDROID,
  })
  @IsNotEmpty()
  @IsEnum(Platform)
  platform: Platform;

  @ApiPropertyOptional({
    description: 'Type of token: native (FCM/APNs) or expo (Expo push service)',
    enum: TokenType,
    example: TokenType.NATIVE,
    default: TokenType.EXPO,
  })
  @IsOptional()
  @IsEnum(TokenType)
  tokenType?: TokenType;
}
