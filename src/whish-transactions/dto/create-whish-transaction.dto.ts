import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateWhishDto {
  @IsNotEmpty()
  @IsNumber()
  amount: number;

  @IsOptional()
  @IsString()
  currency?: string = 'USD';

  @IsOptional()
  @IsString()
  invoice?: string;

  @IsNotEmpty()
  @IsString()
  externalId: string; // must be unique per order

  @IsOptional()
  @IsString()
  orderId?: string;

  @IsOptional()
  @IsString()
  ownerId?: string;

  @IsOptional()
  @IsString()
  subscriptionTypeId?: string;
}
