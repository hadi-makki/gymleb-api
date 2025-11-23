import { ExpenseEntity } from 'src/expenses/expense.entity';
import { GymEntity } from 'src/gym/entities/gym.entity';
import { ManagerEntity } from 'src/manager/manager.entity';
import { MemberEntity } from 'src/member/entities/member.entity';
import { OwnerSubscriptionTypeEntity } from 'src/owner-subscriptions/owner-subscription-type.entity';
import { PTSessionEntity } from 'src/personal-trainers/entities/pt-sessions.entity';
import { ProductsOffersEntity } from 'src/products/products-offers.entity';
import { ProductEntity } from 'src/products/products.entity';
import { RevenueEntity } from 'src/revenue/revenue.entity';
import {
  SubscriptionEntity,
  SubscriptionType,
} from 'src/subscription/entities/subscription.entity';
import { WhishTransaction } from 'src/whish-transactions/entities/whish-transaction.entity';
import {
  Column,
  Entity,
  Index,
  ManyToOne,
  OneToMany,
  OneToOne,
  RelationId,
} from 'typeorm';
import { PgMainEntity } from '../main-classes/mainEntity';
import { Currency } from 'src/common/enums/currency.enum';

export enum TransactionType {
  SUBSCRIPTION = 'subscription',
  OWNER_SUBSCRIPTION_ASSIGNMENT = 'owner_subscription_assignment',
  REVENUE = 'revenue',
  EXPENSE = 'expense',
  PERSONAL_TRAINER_SESSION = 'personal_trainer_session',
  PRODUCTS_TRANSFER = 'products_transfer',
  PRODUCTS_RECEIVE = 'products_receive',
  PRODUCTS_RETURN = 'products_return',
}

export enum PaymentStatus {
  PAID = 'paid',
  UNPAID = 'unpaid',
  PARTIALLY_PAID = 'partially_paid',
}

export enum SubscriptionStatus {
  FREEZED = 'freezed',
  ON_GOING = 'on_going',
}

@Entity('transactions')
export class TransactionEntity extends PgMainEntity {
  @Column('text', { nullable: true })
  title: string;

  @Column('text', { nullable: true, default: TransactionType.SUBSCRIPTION })
  type: TransactionType;

  @Column('text', { nullable: true })
  subscriptionType: SubscriptionType;

  @Column('timestamp without time zone', { nullable: true })
  endDate: Date;

  @Column('timestamp without time zone', { nullable: true })
  startDate: Date;

  @Column('float')
  paidAmount: number;

  @Column('float', { nullable: true })
  originalAmount: number;

  @Column('text', { default: Currency.USD })
  currency: Currency;

  @ManyToOne(() => GymEntity, (gym) => gym.transactions, {
    onDelete: 'SET NULL',
  })
  @Index()
  gym: GymEntity;

  @RelationId((transaction: TransactionEntity) => transaction.gym)
  gymId: string | null;

  @ManyToOne(
    () => SubscriptionEntity,
    (subscription) => subscription.transactions,
    {
      onDelete: 'SET NULL',
    },
  )
  subscription: SubscriptionEntity;

  @RelationId((transaction: TransactionEntity) => transaction.subscription)
  subscriptionId: string | null;

  @ManyToOne(() => MemberEntity, (member) => member.transactions, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  member: MemberEntity;

  @RelationId((transaction: TransactionEntity) => transaction.member)
  memberId: string | null;

  // Owner subscription assignment transaction
  @ManyToOne(() => ManagerEntity, (manager) => manager.transactions, {
    onDelete: 'SET NULL',
  })
  owner: ManagerEntity;

  @RelationId((transaction: TransactionEntity) => transaction.owner)
  ownerId: string | null;

  @ManyToOne(
    () => OwnerSubscriptionTypeEntity,
    (ownerSubscriptionType) => ownerSubscriptionType.transactions,
    { nullable: true, onDelete: 'SET NULL' },
  )
  ownerSubscriptionType: OwnerSubscriptionTypeEntity;

  @RelationId(
    (transaction: TransactionEntity) => transaction.ownerSubscriptionType,
  )
  ownerSubscriptionTypeId: string | null;

  @Column('boolean', { default: false })
  isOwnerSubscriptionAssignment: boolean;

  @Column('text', { nullable: true })
  paidBy: string;

  @Column('boolean', { default: false })
  isInvalidated: boolean;

  @Column('timestamp without time zone', { nullable: true })
  invalidatedAt: Date;

  @ManyToOne(() => ProductEntity, (product) => product.transactions, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  product: ProductEntity;

  @RelationId((transaction: TransactionEntity) => transaction.product)
  productId: string | null;

  @Column('int', { nullable: true })
  numberSold: number;

  @OneToOne(() => RevenueEntity, (revenue) => revenue.transaction, {
    onDelete: 'CASCADE',
  })
  revenue: RevenueEntity;

  @RelationId((transaction: TransactionEntity) => transaction.revenue)
  revenueId: string | null;

  @OneToOne(() => ExpenseEntity, (expense) => expense.transaction, {
    onDelete: 'CASCADE',
  })
  expense: ExpenseEntity;

  @Column('timestamp without time zone', { nullable: true })
  date: Date;

  @ManyToOne(() => ManagerEntity, (manager) => manager.transactions, {
    onDelete: 'SET NULL',
  })
  personalTrainer: ManagerEntity;

  @RelationId((transaction: TransactionEntity) => transaction.personalTrainer)
  personalTrainerId: string | null;

  @Column('float', { nullable: true })
  gymsPTSessionPercentage: number;

  @Column('boolean', { default: true })
  isTakingPtSessionsCut: boolean;

  @Column('boolean', { default: true })
  isPaid: boolean;

  @Column('text', { default: PaymentStatus.PAID })
  status: PaymentStatus;

  @Column('timestamp without time zone', { nullable: true, default: null })
  paidAt: Date;

  @Column('boolean', { default: false })
  isSubscription: boolean;

  @Column('boolean', { default: false })
  willPayLater: boolean;

  @OneToOne(() => PTSessionEntity, (ptSession) => ptSession.transaction, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  ptSession: PTSessionEntity;

  @RelationId((transaction: TransactionEntity) => transaction.ptSession)
  ptSessionId: string | null;

  @ManyToOne(() => PTSessionEntity, (ptSession) => ptSession.transactions, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  relatedPtSession: PTSessionEntity;

  @RelationId((transaction: TransactionEntity) => transaction.relatedPtSession)
  relatedPtSessionId: string | null;

  @ManyToOne(() => GymEntity, (gym) => gym.productTransferTransactions)
  transferedFrom: GymEntity;

  @RelationId((transaction: TransactionEntity) => transaction.transferedFrom)
  transferedFromId: string | null;

  @ManyToOne(() => GymEntity, (gym) => gym.productReceiveTransactions)
  transferedTo: GymEntity;

  @RelationId((transaction: TransactionEntity) => transaction.transferedTo)
  transferedToId: string | null;

  @Column('int', { nullable: true })
  transferQuantity: number;

  @Column('int', { nullable: true })
  receiveQuantity: number;

  @Column('int', { nullable: true })
  returnedQuantity: number;

  @ManyToOne(() => ProductsOffersEntity, (offer) => offer.products)
  offer: ProductsOffersEntity;

  @RelationId((transaction: TransactionEntity) => transaction.offer)
  offerId: string | null;

  @OneToMany(
    () => WhishTransaction,
    (whishTransaction) => whishTransaction.transaction,
  )
  whishTransactions: WhishTransaction[];

  @Column('boolean', { default: false })
  isNotified: boolean;

  @Column('boolean', { default: false })
  forFree: boolean;

  @Column('boolean', { default: false })
  isBirthdaySubscription: boolean;

  @Column('boolean', { default: false })
  subscriptionReminderSentManually: boolean;

  @Column('text', { default: SubscriptionStatus.ON_GOING })
  subscriptionStatus: SubscriptionStatus;

  @Column('timestamp without time zone', { nullable: true })
  freezedAt: Date;
}
