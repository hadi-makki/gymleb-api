import { ApiProperty } from '@nestjs/swagger';
import { PTSessionEntity } from 'src/personal-trainers/entities/pt-sessions.entity';

export class MemberWithPtSessionsDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ required: false })
  email?: string;

  @ApiProperty({ required: false })
  phone?: string;

  @ApiProperty({ type: [PTSessionEntity] })
  ptSessions: PTSessionEntity[];
}

export class UserPtSessionsResponseDto {
  @ApiProperty({ type: [MemberWithPtSessionsDto] })
  members: MemberWithPtSessionsDto[];

  @ApiProperty({ required: false })
  gymId?: string;

  @ApiProperty({ required: false })
  gymName?: string;

  @ApiProperty({ required: false })
  allowMembersSetPtTimes?: boolean;
}
