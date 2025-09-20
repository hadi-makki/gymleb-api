import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class UpdateMultiSubscriptionDto {
  @ApiProperty({
    description: 'Enable multi-subscription feature for the gym',
    example: true,
  })
  @IsBoolean()
  enableMultiSubscription: boolean;
}
