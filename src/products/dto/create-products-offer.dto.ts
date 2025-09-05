import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString, Min, Max } from 'class-validator';

export class CreateProductsOfferDto {
  @ApiProperty({
    description: 'Name of the product offer',
    example: 'Summer Sale 2024',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Discount percentage (0-100)',
    example: 20,
    minimum: 0,
    maximum: 100,
  })
  @IsNumber()
  @Min(0)
  @Max(100)
  discountPercentage: number;
}

export class UpdateProductsOfferDto {
  @ApiProperty({
    description: 'Name of the product offer',
    example: 'Summer Sale 2024',
    required: false,
  })
  @IsString()
  @IsNotEmpty()
  name?: string;

  @ApiProperty({
    description: 'Discount percentage (0-100)',
    example: 25,
    minimum: 0,
    maximum: 100,
    required: false,
  })
  @IsNumber()
  @Min(0)
  @Max(100)
  discountPercentage?: number;
}
