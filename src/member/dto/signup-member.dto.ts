import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class SignupMemberDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  email?: string;

  @IsNotEmpty()
  @IsString()
  phoneNumber: string;

  @IsNotEmpty()
  @IsString()
  phoneNumberISOCode: string;

  @IsNotEmpty()
  @IsString()
  gymId: string;

  @IsOptional()
  @IsString()
  password?: string;
}
