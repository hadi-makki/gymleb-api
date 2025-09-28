import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class UpdateMonthlyReminderDto {
  @ApiProperty({
    description: 'Whether to send monthly reminders for subscriptions',
    example: true,
  })
  @IsBoolean()
  sendMonthlyReminder: boolean;
}
