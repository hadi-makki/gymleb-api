import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, Min } from 'class-validator';

export class UpdateSessionTimeDto {
  @ApiProperty({
    description: 'Session time in hours (0.25 steps)',
    example: 1.5,
    minimum: 0.25,
  })
  @IsNumber()
  @Min(0.25)
  sessionTimeInHours: number;
}
