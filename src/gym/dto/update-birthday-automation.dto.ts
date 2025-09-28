import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpdateBirthdayAutomationDto {
  @ApiProperty({
    description: 'Whether to enable birthday automation',
    example: true,
  })
  @IsBoolean()
  enableBirthdayAutomation: boolean;

  @ApiProperty({
    description: 'Whether to send birthday messages',
    example: true,
  })
  @IsBoolean()
  sendBirthdayMessage: boolean;

  @ApiProperty({
    description: 'Whether to grant birthday subscription',
    example: true,
  })
  @IsBoolean()
  grantBirthdaySubscription: boolean;

  @ApiProperty({
    description: 'Subscription ID to grant on birthday',
    example: 'uuid-string',
    required: false,
  })
  @IsOptional()
  @IsString()
  birthdaySubscriptionId?: string | null;
}
