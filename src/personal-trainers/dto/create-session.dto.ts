import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateSessionDto {
  @ApiProperty({
    description: 'The ID of the personal trainer',
    example: '6621b0a9b547942bc1111111',
  })
  @IsNotEmpty()
  @IsString()
  personalTrainerId: string;

  @ApiProperty({
    description: 'IDs of members attending the session',
    example: ['6621b0a9b547942bc1111111', '6621b0a9b547942bc2222222'],
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  memberIds: string[];

  @ApiProperty({
    description: 'The date of the session',
    example: '2025-01-01',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  date?: string;

  @ApiProperty({
    description: 'The price of the session',
    example: 100,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  sessionPrice?: number;

  @ApiProperty({
    description: 'The number of sessions',
  })
  @IsNotEmpty()
  @IsNumber()
  numberOfSessions: number;

  @ApiProperty({
    description: 'The type of the session',
    example: 'personal_trainer',
  })
  @IsOptional()
  @IsBoolean()
  willPayLater: boolean;

  @ApiProperty({
    description: 'The type of the session',
    example: 'personal_trainer',
  })
  @IsOptional()
  @IsBoolean()
  isTakingPtSessionsCut: boolean;

  @ApiProperty({
    description: 'Duration of the session in hours (overrides PT default)',
    example: 1.5,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  sessionDurationHours?: number;
}
