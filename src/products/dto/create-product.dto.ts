import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
} from 'class-validator';
import { IsEnum } from 'class-validator';
import { Currency } from 'src/common/enums/currency.enum';

export class CreateProductDto {
  @ApiProperty({
    description: 'Product name',
    example: 'Protein Powder',
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Product price',
    example: 29.99,
  })
  @IsNotEmpty()
  @Transform(({ value }) => Number(value))
  @IsNumber()
  // add max value for integer
  @Max(1000000, { message: 'Price cannot exceed 1,000,000' })
  price: number;

  @ApiProperty({
    description: 'Product description',
    example: 'High-quality whey protein powder for muscle building',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Barcode/Scan code for the product',
    example: 'EAN-13-1234567890123',
    required: false,
  })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiProperty({
    description: 'Product stock quantity',
    example: 100,
    required: true,
  })
  @IsNotEmpty()
  @Transform(({ value }) => Number(value))
  @IsNumber()
  @Max(1000000, { message: 'Stock cannot exceed 1,000,000' })
  stock: number;

  @ApiProperty({ required: false, enum: Currency })
  @IsOptional()
  @IsEnum(Currency)
  currency?: Currency;
}

export class UpdateProductDto {
  @ApiProperty({
    description: 'Product name',
    example: 'Protein Powder',
    required: false,
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({
    description: 'Product price',
    example: 29.99,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => Number(value))
  @Max(1000000, { message: 'Price cannot exceed 1,000,000' })
  price?: number;

  @ApiProperty({
    description: 'Product description',
    example: 'High-quality whey protein powder for muscle building',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Barcode/Scan code for the product',
    example: 'EAN-13-1234567890123',
    required: false,
  })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiProperty({
    description: 'Product stock quantity',
    example: 100,
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsNumber()
  @Max(1000000, { message: 'Stock cannot exceed 1,000,000' })
  stock?: number;

  @ApiProperty({ required: false, enum: Currency })
  @IsOptional()
  @IsEnum(Currency)
  currency?: Currency;
}

export class UploadFileDto {
  @ApiProperty({
    format: 'binary',
    type: 'string',
    description: 'Product image file',
  })
  file: any;
}
