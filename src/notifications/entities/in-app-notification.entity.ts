import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  RelationId,
} from 'typeorm';
import { PgMainEntity } from '../../main-classes/mainEntity';
import { MemberEntity } from '../../member/entities/member.entity';
import { ManagerEntity } from '../../manager/manager.entity';
import { TransactionEntity } from '../../transactions/transaction.entity';
import { SubscriptionEntity } from '../../subscription/entities/subscription.entity';
import { PTSessionEntity } from '../../personal-trainers/entities/pt-sessions.entity';
import { GymEntity } from '../../gym/entities/gym.entity';
import { UserEntity } from '../../user/user.entity';

export enum NotificationProvider {
  EXPO = 'expo',
  FIREBASE = 'firebase',
}

export enum NotificationCategory {
  PAYMENT = 'payment',
  SUBSCRIPTION = 'subscription',
  EXPIRY = 'expiry',
  RENEWAL = 'renewal',
  REMINDER = 'reminder',
  GENERAL = 'general',
  PT_SESSION = 'pt_session',
}

export enum NotificationRecipientType {
  MEMBER = 'member',
  MANAGER = 'manager',
  USER = 'user',
}

export enum NotificationDeliveryStatus {
  PENDING = 'pending',
  SENT = 'sent',
  DELIVERED = 'delivered',
  FAILED = 'failed',
  ERROR = 'error',
}

export enum NotificationPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
}

@Entity('in_app_notifications')
@Index(['recipientId', 'recipientType'])
@Index(['createdAt'])
@Index(['isRead'])
@Index(['deliveryStatus'])
export class InAppNotificationEntity extends PgMainEntity {
  // Provider information
  @Column({
    type: 'text',
    enum: NotificationProvider,
  })
  provider: NotificationProvider;

  // Notification category/type
  @Column({
    type: 'text',
    enum: NotificationCategory,
  })
  category: NotificationCategory;

  // Recipient information
  @Column({
    type: 'text',
    enum: NotificationRecipientType,
  })
  recipientType: NotificationRecipientType;

  @ManyToOne(() => MemberEntity, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'memberId' })
  member: MemberEntity | null;

  @RelationId((notification: InAppNotificationEntity) => notification.member)
  memberId: string | null;

  @ManyToOne(() => UserEntity, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'userId' })
  user: UserEntity | null;

  @RelationId((notification: InAppNotificationEntity) => notification.user)
  userId: string | null;

  @ManyToOne(() => ManagerEntity, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'managerId' })
  manager: ManagerEntity | null;

  @RelationId((notification: InAppNotificationEntity) => notification.manager)
  managerId: string | null;

  // Computed recipientId for indexing (will be set based on recipientType)
  @Column('uuid', { nullable: true })
  @Index()
  recipientId: string | null;

  // Related entities (optional)
  @ManyToOne(() => TransactionEntity, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'transactionId' })
  transaction: TransactionEntity | null;

  @RelationId(
    (notification: InAppNotificationEntity) => notification.transaction,
  )
  transactionId: string | null;

  @ManyToOne(() => SubscriptionEntity, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'subscriptionId' })
  subscription: SubscriptionEntity | null;

  @RelationId(
    (notification: InAppNotificationEntity) => notification.subscription,
  )
  subscriptionId: string | null;

  @ManyToOne(() => PTSessionEntity, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'ptSessionId' })
  ptSession: PTSessionEntity | null;

  @RelationId((notification: InAppNotificationEntity) => notification.ptSession)
  ptSessionId: string | null;

  @ManyToOne(() => GymEntity, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'gymId' })
  gym: GymEntity | null;

  @RelationId((notification: InAppNotificationEntity) => notification.gym)
  gymId: string | null;

  // Notification content
  @Column('text')
  title: string;

  @Column('text')
  body: string;

  @Column('jsonb', { nullable: true, default: {} })
  data: Record<string, unknown>;

  // Delivery status
  @Column({
    type: 'text',
    enum: NotificationDeliveryStatus,
    default: NotificationDeliveryStatus.PENDING,
  })
  deliveryStatus: NotificationDeliveryStatus;

  // Provider response
  @Column('text', { nullable: true })
  providerTicketId: string | null; // Expo ticket ID or Firebase message ID

  @Column('text', { nullable: true })
  providerError: string | null; // Error message from provider if failed

  // Read status
  @Column('boolean', { default: false })
  isRead: boolean;

  @Column('timestamp without time zone', { nullable: true })
  readAt: Date | null;

  // Notification settings
  @Column({
    type: 'text',
    enum: NotificationPriority,
    default: NotificationPriority.NORMAL,
  })
  priority: NotificationPriority;

  @Column('int', { nullable: true })
  badge: number | null;

  @Column('text', { nullable: true, default: 'default' })
  sound: string | null;

  // Scheduled notifications
  @Column('timestamp without time zone', { nullable: true })
  scheduledFor: Date | null;

  @Column('timestamp without time zone', { nullable: true })
  sentAt: Date | null;

  @Column('timestamp without time zone', { nullable: true })
  deliveredAt: Date | null;
}
