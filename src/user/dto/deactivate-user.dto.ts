import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class DeactivateUserDto {
  @ApiProperty({
    description: 'User password for verification',
    example: 'password123',
  })
  @IsNotEmpty()
  @IsString()
  password: string;
}
