import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, Max, Min } from 'class-validator';

export class UpdatePTPercentageDto {
  @ApiProperty({
    description: "Gym's cut percentage from PT sessions",
    minimum: 0,
    maximum: 100,
    example: 20,
  })
  @IsNumber()
  @Min(0)
  @Max(100)
  percentage: number;
}
