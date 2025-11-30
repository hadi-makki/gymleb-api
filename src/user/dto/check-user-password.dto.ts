import { IsNotEmpty, IsString } from 'class-validator';

export class CheckUserPasswordDto {
  @IsNotEmpty()
  @IsString()
  phoneNumber: string;

  @IsNotEmpty()
  @IsString()
  phoneNumberISOCode: string;
}
