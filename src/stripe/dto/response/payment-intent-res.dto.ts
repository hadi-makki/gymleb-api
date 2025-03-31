import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class PaymentIntentResDto {
  @IsString()
  @ApiProperty()
  client_secret: string;
}
