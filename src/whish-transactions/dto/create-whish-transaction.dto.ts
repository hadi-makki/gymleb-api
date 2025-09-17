import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateWhishDto {
  @IsOptional()
  @IsString()
  externalId?: string; // generated server-side when omitted

  @IsNotEmpty()
  @IsString()
  orderId: string; // gymId

  @IsNotEmpty()
  @IsString()
  subscriptionTypeId: string;
}
