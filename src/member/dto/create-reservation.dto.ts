import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsString, IsOptional, IsBoolean } from 'class-validator';

export class CreateReservationDto {
  @ApiProperty({ description: 'Gym ID' })
  @IsString()
  gymId: string;

  @ApiProperty({ description: 'Reservation date (YYYY-MM-DD format)' })
  @IsDateString()
  reservationDate: string;

  @ApiProperty({ description: 'Start time (HH:MM format)' })
  @IsString()
  startTime: string;

  @ApiProperty({ description: 'End time (HH:MM format)' })
  @IsString()
  endTime: string;

  @ApiProperty({ description: 'Day of the week' })
  @IsString()
  dayOfWeek: string;

  @ApiProperty({ description: 'Optional notes', required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}
