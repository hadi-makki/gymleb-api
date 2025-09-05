import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class LoginMemberDto {
  @IsNotEmpty()
  @IsString()
  phoneNumber: string;

  @IsOptional()
  @IsString()
  password: string;

  @IsNotEmpty()
  @IsString()
  gymId: string;
}
