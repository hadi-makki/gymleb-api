import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class UpdateAutoRenewDto {
  @ApiProperty({
    description: 'Auto-renewal status for the gym subscription',
    example: true,
  })
  @IsBoolean()
  isAutoRenew: boolean;
}
