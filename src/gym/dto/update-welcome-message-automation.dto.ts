import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class UpdateWelcomeMessageAutomationDto {
  @ApiProperty({
    description:
      'Whether to automatically send welcome messages to new members',
    example: true,
  })
  @IsBoolean()
  sendWelcomeMessageAutomatically: boolean;
}
