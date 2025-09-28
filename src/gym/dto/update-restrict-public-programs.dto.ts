import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class UpdateRestrictPublicProgramsDto {
  @ApiProperty({
    description: 'Whether to restrict public programs to active members only',
    example: true,
  })
  @IsBoolean()
  restrict: boolean;
}
