import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsPositive } from 'class-validator';

export class MarkBillPaidDto {
  @ApiProperty({ required: false, description: 'Required for dynamic bills' })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  amount?: number;
}

