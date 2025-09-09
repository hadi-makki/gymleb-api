import { IsNotEmpty, IsNumber, IsPositive } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ExtendMembershipDurationDto {
  @ApiProperty({
    description: 'Number of days to extend the membership',
    example: 30,
    minimum: 1,
  })
  @IsNotEmpty()
  @IsNumber()
  @IsPositive()
  days: number;
}
