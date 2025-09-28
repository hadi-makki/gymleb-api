import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class UpdateShowPersonalTrainersDto {
  @ApiProperty({
    description: 'Whether to show personal trainers on the public page',
    example: true,
  })
  @IsBoolean()
  showPersonalTrainers: boolean;
}
