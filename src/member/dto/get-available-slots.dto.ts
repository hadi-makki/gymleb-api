import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsString } from 'class-validator';

export class GetAvailableSlotsDto {
  @ApiProperty({ description: 'Gym ID' })
  @IsString()
  gymId: string;

  @ApiProperty({ description: 'Date to get slots for (YYYY-MM-DD format)' })
  @IsDateString()
  date: string;

  @ApiProperty({ description: 'Day of the week' })
  @IsString()
  dayOfWeek: string;
}
