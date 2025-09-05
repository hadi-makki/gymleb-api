import {
  IsNotEmpty,
  IsNumber,
  IsString,
  IsUUID,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ReturnProductDto {
  @ApiProperty({
    description: 'ID of the gym that is returning the product',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsNotEmpty()
  @IsString()
  @IsUUID()
  returnerGymId: string;

  @ApiProperty({
    description: 'Quantity of the product to return',
    example: 3,
    minimum: 1,
    maximum: 1000,
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(1, { message: 'Return quantity must be at least 1' })
  @Max(1000, { message: 'Return quantity cannot exceed 1000' })
  returnQuantity: number;
}
