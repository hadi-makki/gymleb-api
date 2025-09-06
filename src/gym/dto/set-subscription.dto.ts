import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsUUID,
  IsOptional,
  IsDateString,
  IsBoolean,
} from 'class-validator';

export class SetSubscriptionDto {
  @ApiProperty({
    description: 'The ID of the subscription type to assign to the gym',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  subscriptionTypeId: string;

  @ApiProperty({
    description: 'Optional custom start date for the subscription',
    example: '2024-01-01T00:00:00.000Z',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({
    description: 'Optional custom end date for the subscription',
    example: '2024-12-31T23:59:59.999Z',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiProperty({
    description: 'Whether to reset notifications',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  resetNotifications?: boolean;
}
