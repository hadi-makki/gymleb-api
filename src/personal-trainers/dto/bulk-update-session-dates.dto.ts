import { ApiProperty } from '@nestjs/swagger';
import { ArrayNotEmpty, IsArray, IsIn, IsNotEmpty, IsString, Matches } from 'class-validator';

export class BulkUpdateSessionDatesDto {
  @ApiProperty({
    description: 'Array of PT session IDs to update in order',
    example: ['b1f2...', 'a9c3...'],
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  sessionIds!: string[];

  @ApiProperty({
    description: 'Target weekday for the sessions',
    example: 'monday',
    enum: ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
  })
  @IsNotEmpty()
  @IsString()
  @IsIn(['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'])
  weekday!: string;

  @ApiProperty({
    description: 'Time of day in HH:mm (24h) format',
    example: '17:00',
  })
  @IsNotEmpty()
  @Matches(/^\d{2}:\d{2}$/)
  time!: string;
}


