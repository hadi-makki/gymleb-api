import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsEnum, IsOptional, IsString } from 'class-validator';
import { Permissions } from 'src/decorators/roles/role.enum';

export class UpdateStaffDto {
  @ApiProperty()
  @IsString()
  username?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  email?: string;

  @ApiProperty()
  @IsString()
  password?: string;

  @ApiProperty()
  @IsArray()
  @IsEnum(Permissions, { each: true })
  permissions?: Permissions[];

  @ApiProperty()
  @IsString()
  @IsOptional()
  phoneNumber?: string;
}
