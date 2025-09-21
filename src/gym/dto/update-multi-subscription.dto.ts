import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class UpdateMultiSubscriptionDto {
  @ApiProperty({
    description: 'Enable or disable multi-subscription feature for the gym',
    example: true,
    type: Boolean,
  })
  @IsBoolean({
    message: 'enableMultiSubscription must be a boolean value',
  })
  enableMultiSubscription: boolean;
}
