import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateGymNameDto {
  @IsString()
  @IsNotEmpty()
  name: string;
}
