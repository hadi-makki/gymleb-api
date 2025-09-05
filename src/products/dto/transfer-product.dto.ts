import {
  IsNotEmpty,
  IsNumber,
  IsString,
  IsUUID,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class TransferProductDto {
  @ApiProperty({
    description: 'ID of the gym where the product is currently located',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsNotEmpty()
  @IsString()
  @IsUUID()
  gymId: string;

  @ApiProperty({
    description: 'ID of the gym to transfer the product to',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  @IsNotEmpty()
  @IsString()
  @IsUUID()
  transferedToId: string;

  @ApiProperty({
    description: 'Quantity of the product to transfer',
    example: 5,
    minimum: 1,
    maximum: 1000,
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(1, { message: 'Transfer quantity must be at least 1' })
  @Max(1000, { message: 'Transfer quantity cannot exceed 1000' })
  transferQuantity: number;
}
