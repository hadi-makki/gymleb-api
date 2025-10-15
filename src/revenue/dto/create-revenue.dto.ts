import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';
import { IsEnum } from 'class-validator';
import { Currency } from 'src/common/enums/currency.enum';

export class CreateRevenueDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty()
  @IsNumber()
  @IsPositive()
  amount: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  date?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  productId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  numberSold?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  offerId?: string;

  @ApiProperty({ required: false, enum: Currency })
  @IsOptional()
  @IsEnum(Currency)
  currency?: Currency;
}
