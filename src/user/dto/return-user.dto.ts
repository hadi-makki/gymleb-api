import { GymEntity } from 'src/gym/entities/gym.entity';
import { MemberEntity } from 'src/member/entities/member.entity';
import { MediaEntity } from 'src/media/media.entity';

export class ReturnUserDto {
  id: string;
  name: string;
  phone: string | null;
  phoneNumberISOCode: string | null;
  profileImage?: MediaEntity;
  trainingLevel?: string | null;
  trainingGoals?: string | null;
  trainingPreferences?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export class ReturnUserWithTokenDto extends ReturnUserDto {
  token: string;
  deviceId: string;
}

export class ReturnUserMeDto extends ReturnUserDto {
  members: Partial<MemberEntity>[];
  gyms: Partial<GymEntity>[];
}
