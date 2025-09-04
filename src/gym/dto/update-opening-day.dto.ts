import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsString, IsOptional } from 'class-validator';

export class UpdateOpeningDayDto {
  @ApiProperty({ description: 'Day of the week' })
  @IsString()
  day: string;

  @ApiProperty({ description: 'Whether the gym is open on this day' })
  @IsBoolean()
  isOpen: boolean;

  @ApiProperty({ description: 'Opening time (HH:MM format)', required: false })
  @IsOptional()
  @IsString()
  openingTime?: string;

  @ApiProperty({ description: 'Closing time (HH:MM format)', required: false })
  @IsOptional()
  @IsString()
  closingTime?: string;
}
