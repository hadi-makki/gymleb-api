import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class LoginMemberWithoutGymDto {
  @IsNotEmpty()
  @IsString()
  phoneNumber: string;

  @IsNotEmpty()
  @IsString()
  phoneNumberISOCode: string;

  @IsOptional()
  @IsString()
  password?: string;

  @IsOptional()
  @IsString()
  memberId?: string;
}

