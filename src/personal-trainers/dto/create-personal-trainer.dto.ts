import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreatePersonalTrainerDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  lastName: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  email: string;

  @ApiProperty()
  @IsString()
  phone: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  password: string;
}
