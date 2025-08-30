import { IsEnum, IsNumber, IsString } from 'class-validator';
import { SubscriptionType } from '../entities/subscription.entity';
export class CreateSubscriptionDto {
  @IsString()
  title: string;

  @IsEnum(SubscriptionType)
  type: SubscriptionType;

  @IsNumber()
  price: number;

  @IsNumber()
  duration: number;
}
