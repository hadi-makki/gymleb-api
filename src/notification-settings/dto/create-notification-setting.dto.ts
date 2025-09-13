import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class CreateNotificationSettingDto {
  @ApiProperty()
  @IsBoolean()
  welcomeMessage: boolean;

  @ApiProperty()
  @IsBoolean()
  monthlyReminder: boolean;
}
