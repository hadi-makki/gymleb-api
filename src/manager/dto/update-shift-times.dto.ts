import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, Matches } from 'class-validator';

export class UpdateShiftTimesDto {
  @ApiProperty({
    description: 'Shift start time in HH:mm format',
    example: '09:00',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'Shift start time must be in HH:mm format',
  })
  shiftStartTime?: string;

  @ApiProperty({
    description: 'Shift end time in HH:mm format',
    example: '17:00',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'Shift end time must be in HH:mm format',
  })
  shiftEndTime?: string;
}
