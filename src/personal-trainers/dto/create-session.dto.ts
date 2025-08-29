import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDate,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateSessionDto {
  @ApiProperty({
    description: 'The ID of the member',
    example: '6621b0a9b547942bc1111111',
  })
  @IsNotEmpty()
  @IsString()
  personalTrainerId: string;

  @ApiProperty({
    description: 'The ID of the member',
    example: '6621b0a9b547942bc1111111',
  })
  @IsNotEmpty()
  @IsString()
  memberId: string;

  @ApiProperty({
    description: 'The date of the session',
    example: '2025-01-01',
  })
  @IsNotEmpty()
  @IsDate()
  date: Date;

  @ApiProperty({
    description: 'The price of the session',
    example: 100,
  })
  @IsNotEmpty()
  @IsNumber()
  sessionPrice: number;

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
}
