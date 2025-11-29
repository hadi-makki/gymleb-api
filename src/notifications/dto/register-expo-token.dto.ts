import { IsNotEmpty, IsString, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum Platform {
  IOS = 'ios',
  ANDROID = 'android',
  WEB = 'web',
}

export class RegisterExpoTokenDto {
  @ApiProperty({
    description: 'Expo push token for the device',
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
}
