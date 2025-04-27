import { IsNotEmpty, IsString } from 'class-validator';

export class GetGymByNameDto {
  @IsString()
  @IsNotEmpty()
  gymName: string;
}
