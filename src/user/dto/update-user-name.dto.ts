import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class UpdateUserNameDto {
  @IsNotEmpty()
  @IsString()
  @MinLength(1, { message: 'Name must be at least 1 character long' })
  name: string;
}
