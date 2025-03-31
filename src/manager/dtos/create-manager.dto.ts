import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsString,
  IsStrongPassword,
  IsUUID,
  Matches,
} from 'class-validator';
import { Role } from 'src/decorators/roles/role.enum';

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

  @ApiProperty()
  @IsEnum(Role, { each: true })
  roles: Role[];
}
