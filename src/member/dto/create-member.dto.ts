import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateMemberDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  email?: string;

  @IsNotEmpty()
  @IsString()
  phone: string;

  @IsNotEmpty()
  @IsString()
  subscriptionId: string;

  // For daily subscriptions: if true, grant 24 hours; if false/undefined, end of the day
  @IsOptional()
  @IsBoolean()
  giveFullDay?: boolean;
}
