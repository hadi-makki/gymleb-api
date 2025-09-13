import { MediaEntity } from 'src/media/media.entity';
import { TransactionEntity } from 'src/transactions/transaction.entity';
import { MemberAttendingDaysEntity } from '../entities/member-attending-days.entity';
import { MemberReservationEntity } from '../entities/member-reservation.entity';
import { MemberTrainingProgramEntity } from '../entities/member-training-program.entity';

export class ReturnUserDto {
  id: string;
  name: string;
  email: string;
  phone: string;
  gym: any;
  subscription: any;
  subscriptionTransactions: any[];
  createdAt: Date;
  updatedAt: Date;
  hasActiveSubscription: boolean;
  currentActiveSubscription: any;
  isNotified: boolean;
  lastSubscription: TransactionEntity;
  profileImage: MediaEntity;
  attendingDays?: MemberAttendingDaysEntity[];
  trainingLevel: string;
  trainingGoals: string;
  trainingPreferences: string;
  trainingPrograms?: MemberTrainingProgramEntity[];
  reservations?: MemberReservationEntity[];
  weight?: number;
  height?: number;
  waistWidth?: number;
  chestWidth?: number;
  armWidth?: number;
  thighWidth?: number;
  bodyFatPercentage?: number;
  muscleMass?: number;
  bmi?: number;
  bloodType?: string;
  allergies?: string;
  medicalConditions?: string;
  medications?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  lastHealthCheck?: string;
  programLink?: string;
}

export class ReturnUserWithTokenDto extends ReturnUserDto {
  token: string;
}
