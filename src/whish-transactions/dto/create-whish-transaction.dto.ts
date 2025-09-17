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

  @IsOptional()
  @IsString()
  externalId?: string; // generated server-side when omitted

  @IsOptional()
  @IsString()
  orderId?: string; // gymId

  @IsOptional()
  @IsString()
  ownerId?: string;

  @IsOptional()
  @IsString()
  subscriptionTypeId?: string;
}
