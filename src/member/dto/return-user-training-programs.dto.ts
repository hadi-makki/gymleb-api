import { ApiProperty } from '@nestjs/swagger';
import { MemberTrainingProgramEntity } from '../entities/member-training-program.entity';

export class MemberWithTrainingProgramsDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ required: false })
  email?: string;

  @ApiProperty({ required: false })
  phone?: string;

  @ApiProperty({ type: [MemberTrainingProgramEntity] })
  trainingPrograms: MemberTrainingProgramEntity[];
}

export class UserTrainingProgramsResponseDto {
  @ApiProperty({ type: [MemberWithTrainingProgramsDto] })
  members: MemberWithTrainingProgramsDto[];

  @ApiProperty({ required: false })
  gymId?: string;

  @ApiProperty({ required: false })
  gymName?: string;

  @ApiProperty({ required: false })
  allowMemberEditTrainingProgram?: boolean;
}
