import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class UpdateAllowUserReservationsDto {
  @ApiProperty({
    description: 'Whether to allow user reservations',
    example: true,
  })
  @IsBoolean()
  allowUserResevations: boolean;
}
