import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsDateString,
  IsNumber,
} from 'class-validator';

export class CreateMemberDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  email?: string;

  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @IsOptional()
  @IsString()
  phoneNumberISOCode?: string;

  @IsNotEmpty()
  @IsString()
  subscriptionId: string;

  // For daily subscriptions: if true, grant 24 hours; if false/undefined, end of the day
  @IsOptional()
  @IsBoolean()
  giveFullDay?: boolean;

  // Optional custom start date for subscription instance
  @IsOptional()
  @IsDateString()
  startDate?: string;

  // Optional custom end date for subscription instance
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsBoolean()
  willPayLater?: boolean;

  @IsOptional()
  @IsBoolean()
  sendWelcomeMessage?: boolean;

  @IsOptional()
  @IsBoolean()
  sendInvoiceMessage?: boolean;

  @IsOptional()
  @IsNumber()
  paidAmount?: number;
}
