import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsDateString,
  IsNumber,
  IsUUID,
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

  // Optional: pre-seed PT sessions for this member based on the selected subscription
  @IsOptional()
  @IsBoolean()
  preseedPtSessions?: boolean;

  // Required when preseedPtSessions is true: target trainer to assign the sessions to
  @IsOptional()
  @IsUUID()
  personalTrainerId?: string;
}
