import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateManagerDto {
  @IsOptional()
  @IsString()
  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  username: string;

  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;
}
