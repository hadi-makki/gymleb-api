import {
  IsEnum,
  IsOptional,
  IsString,
  IsBoolean,
  ValidateNested,
  IsArray,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { DayOfWeek } from '../entities/member-attending-days.entity';
import { Type } from 'class-transformer';

export class AttendingDayDto {
  @ApiProperty({ enum: DayOfWeek })
  @IsEnum(DayOfWeek)
  dayOfWeek: DayOfWeek;

  @ApiProperty({ required: false, example: '09:00' })
  @IsOptional()
  @IsString()
  startTime?: string;

  @ApiProperty({ required: false, example: '17:00' })
  @IsOptional()
  @IsString()
  endTime?: string;

  @ApiProperty({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateAttendingDaysDto {
  @ApiProperty({ type: [AttendingDayDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AttendingDayDto)
  attendingDays: AttendingDayDto[];
}
