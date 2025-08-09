import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Min,
} from 'class-validator';

export class CreateOwnerSubscriptionTypeDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  title: string;

  @IsNumber()
  @IsPositive()
  @ApiProperty()
  price: number;

  @IsNumber()
  @Min(1)
  @ApiProperty()
  durationDays: number;

  @IsOptional()
  @IsString()
  @ApiProperty({ required: false })
  description?: string;
}

export class AssignOwnerSubscriptionDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  ownerId: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  typeId: string;

  @IsOptional()
  @IsDateString()
  @ApiProperty({ required: false })
  startDate?: string;
}
