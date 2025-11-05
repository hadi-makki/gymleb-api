import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { SubscriptionType } from '../entities/subscription.entity';
import { Currency } from 'src/common/enums/currency.enum';
export class CreateSubscriptionDto {
  @IsString()
  title: string;

  @IsEnum(SubscriptionType)
  type: SubscriptionType;

  @IsNumber()
  price: number;

  @IsNumber()
  duration: number;

  @IsOptional()
  @IsEnum(Currency)
  currency?: Currency;

  @IsOptional()
  @IsNumber()
  ptSessionsCount?: number;
}
