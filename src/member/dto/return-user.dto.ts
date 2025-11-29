import { MediaEntity } from 'src/media/media.entity';
import { TransactionEntity } from 'src/transactions/transaction.entity';
import { MemberAttendingDaysEntity } from '../entities/member-attending-days.entity';
import { MemberTrainingProgramEntity } from '../entities/member-training-program.entity';
import { NotificationSettingEntity } from 'src/notification-settings/entities/notification-setting.entity';
import { SubscriptionEntity } from 'src/subscription/entities/subscription.entity';
import { Gender, WelcomeMessageStatus } from '../entities/member.entity';

export class ReturnUserDto {
  id: string;
  name: string;
  email: string;
  phone: string;
  gender?: Gender;
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
  welcomeMessageStatus?: WelcomeMessageStatus;
  notificationSetting?: NotificationSettingEntity;
  phoneNumberISOCode?: string;
  welcomeMessageSentManually?: boolean;
  hasActiveSessions?: boolean;
}

export class ReturnUserWithTokenDto extends ReturnUserDto {
  token: string;
  deviceId: string;
}
