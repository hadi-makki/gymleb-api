import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class UpdateGymDescriptionDto {
  @ApiProperty({
    description: 'Gym description',
    example: 'A modern fitness center with state-of-the-art equipment',
  })
  @IsString()
  @IsNotEmpty()
  description: string;
}
