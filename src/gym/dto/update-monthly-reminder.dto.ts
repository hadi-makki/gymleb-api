import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsInt, Min, IsOptional } from 'class-validator';
import { MonthlyReminderType } from '../entities/gym.entity';

export class UpdateMonthlyReminderDto {
  @ApiProperty({
    description: 'Whether to send monthly reminders for subscriptions',
    example: true,
  })
  @IsBoolean()
  sendMonthlyReminder: boolean;

  @ApiProperty({
    description: 'Monthly reminder type',
    enum: MonthlyReminderType,
    required: false,
  })
  @IsOptional()
  @IsEnum(MonthlyReminderType)
  monthlyReminderType?: MonthlyReminderType;

  @ApiProperty({
    description: 'Days window for reminder (0 for immediate)',
    example: 3,
    required: false,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  monthlyReminderDays?: number;
}
