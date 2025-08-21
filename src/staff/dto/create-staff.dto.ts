import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { Permissions } from 'src/decorators/roles/role.enum';

export class CreateStaffDto {
  @ApiProperty({
    description: 'The name of the staff',
    example: 'John Doe',
  })
  @IsNotEmpty()
  @IsString()
  username: string;

  @ApiProperty({
    description: 'The email of the staff',
    example: 'john.doe@example.com',
  })
  @IsNotEmpty()
  @IsString()
  email: string;

  @ApiProperty({
    description: 'The password of the staff',
    example: 'password',
  })
  @IsNotEmpty()
  @IsString()
  password: string;

  @ApiProperty({
    description: 'The permissions of the staff',
    example: [Permissions.members],
  })
  @IsNotEmpty()
  @IsEnum(Permissions, { each: true })
  permissions: Permissions[];
}
