import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsStrongPassword,
  IsUUID,
  Matches,
} from 'class-validator';
import { Permissions } from '../../decorators/roles/role.enum';

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
  @IsOptional()
  @IsEmail()
  email: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  phoneNumber: string;

  @ApiProperty()
  @IsEnum(Permissions, { each: true })
  roles: Permissions[];
}
