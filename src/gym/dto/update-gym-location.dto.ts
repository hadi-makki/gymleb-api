import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateGymLocationDto {
  @IsString()
  @IsNotEmpty()
  address: string;

  @IsOptional()
  @IsString()
  googleMapsLink?: string;
}
