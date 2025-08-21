import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsEnum, IsString } from 'class-validator';
import { Permissions } from 'src/decorators/roles/role.enum';

export class UpdateStaffDto {
  @ApiProperty()
  @IsString()
  username?: string;

  @ApiProperty()
  @IsString()
  email?: string;

  @ApiProperty()
  @IsString()
  password?: string;

  @ApiProperty()
  @IsArray()
  @IsEnum(Permissions, { each: true })
  permissions?: Permissions[];
}
