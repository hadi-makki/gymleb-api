import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsString,
  IsEnum,
  IsOptional,
  Min,
  Max,
} from 'class-validator';
import { Currency } from 'src/common/enums/currency.enum';
import { BillType } from '../entities/bill.entity';

export class CreateBillDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsPositive()
  @IsOptional()
  amount?: number;

  @ApiProperty({ enum: Currency, default: Currency.USD })
  @IsEnum(Currency)
  currency: Currency;

  @ApiProperty({ description: 'Day of month (1-31)', minimum: 1, maximum: 31 })
  @IsNumber()
  @Min(1)
  @Max(31)
  dueDate: number;

  @ApiProperty({ enum: BillType, default: BillType.FIXED })
  @IsEnum(BillType)
  billType: BillType;
}
