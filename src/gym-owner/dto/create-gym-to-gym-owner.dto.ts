import { IsNotEmpty, IsString } from 'class-validator';

export class CreateGymToGymOwnerDto {
  @IsNotEmpty()
  @IsString()
  gymOwnerId: string;

  @IsNotEmpty()
  @IsString()
  address: string;

  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  phone: string;
}
