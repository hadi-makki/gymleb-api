import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class UpdateAllowMemberEditTrainingProgramDto {
  @ApiProperty({
    description: 'Whether to allow members to edit their training programs',
    example: true,
  })
  @IsBoolean()
  allowMemberEditTrainingProgram: boolean;
}
