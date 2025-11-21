import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreatePersonalScheduleDto {
  @ApiProperty({
    description: 'Title of the personal schedule event',
    example: 'Team Meeting',
  })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty({
    description: 'Description of the event',
    example: 'Monthly team meeting to discuss progress',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Start date and time in ISO format (UTC)',
    example: '2025-01-15T10:00:00Z',
  })
  @IsNotEmpty()
  @IsDateString()
  startDate: string;

  @ApiProperty({
    description: 'Duration of the event in hours (default: 1)',
    example: 1.5,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  durationHours?: number;

  @ApiProperty({
    description: 'Location of the event',
    example: 'Conference Room A',
    required: false,
  })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiProperty({
    description: 'ID of the gym',
    example: '6621b0a9b547942bc1111111',
  })
  @IsNotEmpty()
  @IsString()
  gymId: string;
}
