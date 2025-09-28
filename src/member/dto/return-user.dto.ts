import { MediaEntity } from 'src/media/media.entity';
import { TransactionEntity } from 'src/transactions/transaction.entity';
import { MemberAttendingDaysEntity } from '../entities/member-attending-days.entity';
import { MemberReservationEntity } from '../entities/member-reservation.entity';
import { MemberTrainingProgramEntity } from '../entities/member-training-program.entity';
import { NotificationSettingEntity } from 'src/notification-settings/entities/notification-setting.entity';
import { SubscriptionEntity } from 'src/subscription/entities/subscription.entity';

export class ReturnUserDto {
  id: string;
  name: string;
  email: string;
  phone: string;
  gym: any;
  subscription: SubscriptionEntity;
  subscriptionTransactions: any[];
  createdAt: Date;
  updatedAt: Date;
  hasActiveSubscription: boolean;
  currentActiveSubscriptions: TransactionEntity[];
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
  birthday?: Date;
  lastHealthCheck?: string;
  programLink?: string;
  isWelcomeMessageSent?: boolean;
  notificationSetting?: NotificationSettingEntity;
  phoneNumberISOCode?: string;
  allowedReservations?: number | null;
  usedReservations?: number;
  welcomeMessageSentManually?: boolean;
}

export class ReturnUserWithTokenDto extends ReturnUserDto {
  token: string;
}
