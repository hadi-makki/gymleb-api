import { IsNotEmpty, IsString } from 'class-validator';

export class LoginMemberDto {
  @IsNotEmpty()
  @IsString()
  username: string;

  @IsNotEmpty()
  @IsString()
  password: string;
}
