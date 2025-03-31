import { IsEmail, IsOptional, IsString, IsUUID } from 'class-validator';

export class UpdateManagerDto {
  @IsOptional()
  @IsString()
  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  username: string;
}
