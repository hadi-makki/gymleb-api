import { ExpenseEntity } from 'src/expenses/expense.entity';
import { ManagerEntity } from 'src/manager/manager.entity';
import { MemberEntity } from 'src/member/entities/member.entity';
import { OwnerSubscriptionTypeEntity } from 'src/owner-subscriptions/owner-subscription-type.entity';
import { PTSessionEntity } from 'src/personal-trainers/entities/pt-sessions.entity';
import { PersonalScheduleEntity } from 'src/personal-schedule/entities/personal-schedule.entity';
import { ProductEntity } from 'src/products/products.entity';
import { RevenueEntity } from 'src/revenue/revenue.entity';
import { SubscriptionEntity } from 'src/subscription/entities/subscription.entity';
import { TransactionEntity } from 'src/transactions/transaction.entity';
import { TwilioMessageEntity } from 'src/twilio/entities/twilio-message.entity';
import { BillEntity } from 'src/bills/entities/bill.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToMany,
  ManyToOne,
  OneToMany,
  RelationId,
} from 'typeorm';
import { PgMainEntity } from '../../main-classes/mainEntity';
import { GymPresetEntity } from './gym-preset.entity';
import { WhishTransaction } from 'src/whish-transactions/entities/whish-transaction.entity';
import { MessageTemplateEntity } from './message-template.entity';
export enum GymTypeEnum {
  FITNESS = 'fitness',
  CALISTHENICS = 'calisthenics',
}

export enum MessageLanguage {
  ENGLISH = 'en',
  ARABIC = 'ar',
}

export enum MonthlyReminderType {
  BEFORE_EXPIRATION = 'before_expiration',
  AFTER_EXPIRATION = 'after_expiration',
  IMMEDIATE_REMINDING = 'immediate_reminding',
}

@Entity('gyms')
export class GymEntity extends PgMainEntity {
  @Column('text')
  name: string;

  @Column('text', { nullable: true })
  gymDashedName: string;

  @Column('text', { nullable: true })
  address: string;

  @Column('text', { nullable: true })
  googleMapsLink: string;

  @Column('text', { nullable: true })
  email: string;

  @Column('text')
  phone: string;

  @Column('text', { nullable: true, default: 'LB' })
  phoneNumberISOCode: string;

  @ManyToMany(() => ManagerEntity, (manager) => manager.gyms)
  personalTrainers: ManagerEntity[];

  @OneToMany(() => SubscriptionEntity, (subscription) => subscription.gym, {
    onDelete: 'SET NULL',
  })
  subscriptions: SubscriptionEntity[];

  @ManyToOne(() => ManagerEntity, (manager) => manager.ownedGyms)
  @JoinColumn({ name: 'ownerId' })
  owner: ManagerEntity;

  @RelationId((gym: GymEntity) => gym.owner)
  ownerId: string | null;

  @OneToMany(() => TransactionEntity, (transaction) => transaction.gym)
  transactions: TransactionEntity[];

  @Column('boolean', { default: false })
  finishedPageSetup: boolean;

  @Column('jsonb')
  openingDays: {
    day: string;
    openingTime: string;
    closingTime: string;
    isOpen: boolean;
  }[];

  @Column('int', { default: 0 })
  membersNotified: number;

  @Column('int', { default: 0 })
  welcomeMessageNotified: number;

  @Column('jsonb', { default: [] })
  womensTimes: {
    day: string;
    from: string;
    to: string;
  }[];

  @Column('text', { nullable: true })
  note: string;

  @Column('text', { nullable: true })
  description: string;

  @Column('jsonb', { default: [] })
  offers: { description: string }[];

  @Column('int', { default: 10 })
  gymsPTSessionPercentage: number;

  @Column('boolean', { default: false })
  isDeactivated: boolean;

  @Column('boolean', { default: false })
  showPersonalTrainers: boolean;

  @Column('boolean', { default: false })
  restrictPublicProgramsToActiveMembers: boolean;

  @OneToMany(() => ProductEntity, (product) => product.gym)
  products: ProductEntity[];

  @OneToMany(() => TransactionEntity, (product) => product.transferedFrom)
  productTransferTransactions: TransactionEntity[];

  @OneToMany(() => TransactionEntity, (product) => product.transferedTo)
  productReceiveTransactions: TransactionEntity[];

  @OneToMany(() => MemberEntity, (member) => member.gym, {
    onDelete: 'SET NULL',
  })
  members: MemberEntity[];

  @OneToMany(() => RevenueEntity, (revenue) => revenue.gym)
  revenues: RevenueEntity[];

  @OneToMany(() => ExpenseEntity, (expense) => expense.gym)
  expenses: ExpenseEntity[];

  @OneToMany(() => BillEntity, (bill) => bill.gym)
  bills: BillEntity[];

  @OneToMany(() => PTSessionEntity, (session) => session.gym)
  ptSessions: PTSessionEntity[];

  @OneToMany(() => GymPresetEntity, (preset) => preset.gym)
  presets: GymPresetEntity[];

  @OneToMany(() => PersonalScheduleEntity, (schedule) => schedule.gym)
  personalSchedules: PersonalScheduleEntity[];

  @Column('text', { nullable: true, default: GymTypeEnum.FITNESS })
  gymType: GymTypeEnum;

  @Column('boolean', { default: false })
  allowUserSignUp: boolean;

  @Column('int', { default: 0 })
  allowedUserResevationsPerSession: number;

  @Column('decimal', { default: 1 })
  sessionTimeInHours: number;

  @Column('jsonb', {
    default: {
      instagram: '',
      facebook: '',
      youtube: '',
      tiktok: '',
    },
  })
  socialMediaLinks: {
    instagram: string;
    facebook: string;
    youtube: string;
    tiktok: string;
  };

  @ManyToOne(
    () => OwnerSubscriptionTypeEntity,
    (ownerSubscriptionType) => ownerSubscriptionType.gyms,
    {
      onDelete: 'SET NULL',
    },
  )
  ownerSubscriptionType: OwnerSubscriptionTypeEntity;

  @RelationId((gym: GymEntity) => gym.ownerSubscriptionType)
  ownerSubscriptionTypeId: string | null;

  @Column('boolean', { default: false })
  isAutoRenew: boolean;

  @Column('boolean', { default: false })
  isAiChatEnabled: boolean;

  @Column('text', { nullable: true, default: MessageLanguage.ENGLISH })
  messagesLanguage: MessageLanguage;

  @Column('boolean', { default: true })
  sendWelcomeMessageAutomatically: boolean;

  @OneToMany(() => TwilioMessageEntity, (twilioMessage) => twilioMessage.gym)
  twilioMessages: TwilioMessageEntity[];

  @Column('boolean', { default: false })
  sendInvoiceMessages: boolean;

  @Column('int', { default: 0 })
  invoiceMessageNotified: number;

  // Count of birthday messages sent (for notification limits and UI)
  @Column('int', { default: 0 })
  birthdayMessageNotified: number;

  @OneToMany(() => WhishTransaction, (whishTransaction) => whishTransaction.gym)
  whishTransactions: WhishTransaction[];

  @Column('boolean', { default: false })
  enableMultiSubscription: boolean;

  @OneToMany(
    () => MessageTemplateEntity,
    (messageTemplate) => messageTemplate.gym,
  )
  messageTemplates: MessageTemplateEntity[];

  // Birthday automation settings
  @Column('boolean', { default: false })
  enableBirthdayAutomation: boolean;

  @Column('boolean', { default: false })
  sendBirthdayMessage: boolean;

  @Column('boolean', { default: false })
  grantBirthdaySubscription: boolean;

  // Selected subscription to grant on birthday (stored by id)
  @Column('text', { nullable: true })
  birthdaySubscriptionId: string | null;

  // Monthly reminder settings (controlled by gym owner)
  @Column('boolean', { default: true })
  sendMonthlyReminder: boolean;

  @Column('text', {
    nullable: true,
    default: MonthlyReminderType.BEFORE_EXPIRATION,
  })
  monthlyReminderType: MonthlyReminderType;

  @Column('int', { nullable: true, default: 3 })
  monthlyReminderDays: number;

  // Manual messages permission (controlled by super admin)
  @Column('boolean', { default: false })
  allowManualMessages: boolean;

  // Allow duplicate member phone numbers within the same gym
  @Column('boolean', { default: false })
  allowDuplicateMemberPhoneNumbers: boolean;

  @Column('boolean', { default: false })
  allowUserWithoutPhoneNumber: boolean;

  @Column('boolean', { default: false })
  allowMembersSetPtTimes: boolean;

  @Column('boolean', { default: true })
  allowMemberEditTrainingProgram: boolean;

  // Desktop license key fields
  @Column('text', { nullable: true })
  licenseKey: string | null;

  @Column('timestamp', { nullable: true })
  licenseKeyActivatedAt: Date | null;

  @Column('timestamp', { nullable: true })
  licenseKeyExpiresAt: Date | null;
}
