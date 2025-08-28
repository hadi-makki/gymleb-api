import { SubscriptionType } from '../entities/subscription.model';
import { IsEnum, IsNumber, IsString } from 'class-validator';
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
