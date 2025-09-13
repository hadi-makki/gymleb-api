import { ApiProperty } from '@nestjs/swagger';
import { GymTypeEnum, MessageLanguage } from '../entities/gym.entity';

export class PublicGymDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  gymDashedName: string;

  @ApiProperty()
  address: string;

  @ApiProperty()
  googleMapsLink: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  phone: string;

  @ApiProperty()
  phoneNumberISOCode: string;

  @ApiProperty()
  description: string;

  @ApiProperty()
  gymType: GymTypeEnum;

  @ApiProperty()
  allowUserSignUp: boolean;

  @ApiProperty()
  allowUserResevations: boolean;

  @ApiProperty()
  allowedUserResevationsPerSession: number;

  @ApiProperty()
  sessionTimeInHours: number;

  @ApiProperty()
  socialMediaLinks: {
    instagram: string;
    facebook: string;
    youtube: string;
    tiktok: string;
  };

  @ApiProperty()
  openingDays: {
    day: string;
    openingTime: string;
    closingTime: string;
    isOpen: boolean;
  }[];

  @ApiProperty()
  womensTimes: {
    day: string;
    from: string;
    to: string;
  }[];

  @ApiProperty()
  offers: { description: string }[];

  @ApiProperty()
  showPersonalTrainers: boolean;

  @ApiProperty()
  messagesLanguage: MessageLanguage;

  @ApiProperty()
  createdAt: string;

  @ApiProperty()
  updatedAt: string;
}
