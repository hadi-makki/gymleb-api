import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsNotEmpty,
  IsNumber,
  IsNumberString,
  IsOptional,
  IsString,
} from 'class-validator';

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
  price: number;

  @ApiProperty({
    description: 'Product description',
    example: 'High-quality whey protein powder for muscle building',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;
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
  price?: number;

  @ApiProperty({
    description: 'Product description',
    example: 'High-quality whey protein powder for muscle building',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;
}

export class UploadFileDto {
  @ApiProperty({
    format: 'binary',
    type: 'string',
    description: 'Product image file',
  })
  file: any;
}
