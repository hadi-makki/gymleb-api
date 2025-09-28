import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min } from 'class-validator';

export class UpdateMaxReservationsPerSessionDto {
  @ApiProperty({
    description: 'Maximum number of reservations allowed per session',
    example: 10,
    minimum: 0,
  })
  @IsInt()
  @Min(0)
  allowedUserResevationsPerSession: number;
}
