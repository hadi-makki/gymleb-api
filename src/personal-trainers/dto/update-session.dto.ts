import { ApiProperty } from '@nestjs/swagger';
import {
  IsDate,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class UpdateSessionDto {
  @ApiProperty({
    description: 'The ID of the member',
    example: '6621b0a9b547942bc1111111',
    required: false,
  })
  @IsOptional()
  @IsString()
  memberId?: string;

  @ApiProperty({
    description: 'The date of the session',
    example: '2025-01-01',
    required: false,
  })
  @IsOptional()
  @IsDate()
  date?: Date;

  @ApiProperty({
    description: 'The price of the session',
    example: 100,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  sessionPrice?: number;
}
