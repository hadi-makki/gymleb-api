import {
  IsBoolean,
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class AddSubscriptionToMemberDto {
  /**
   * The subscription ID to add to the member.
   */
  @IsString({ message: 'Subscription ID must be a string' })
  @IsUUID()
  subscriptionId: string;

  /**
   * For daily subscriptions only: whether to give a full 24 hours
   * (true) or expire at end of day (false).
   * Default: false (end of day)
   */
  @IsOptional()
  @IsBoolean({ message: 'giveFullDay must be a boolean value' })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value === 'true' || value === '1';
    }
    return value;
  })
  giveFullDay?: boolean;

  @IsOptional()
  @IsBoolean({ message: 'willPayLater must be a boolean value' })
  willPayLater?: boolean;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsNumber()
  paidAmount?: number;
}
