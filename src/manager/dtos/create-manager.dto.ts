import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  IsStrongPassword,
  IsUUID,
  Matches,
} from 'class-validator';

export class CreateManagerDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  //check if username is only spaces
  @Matches(/^(?!^\s*$).+$/, { message: 'Username cannot be empty' })
  username: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @IsStrongPassword()
  password: string;

  @ApiProperty()
  @IsString()
  @IsEmail()
  @IsNotEmpty()
  email: string;
}
