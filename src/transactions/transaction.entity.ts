import { ExpenseEntity } from 'src/expenses/expense.entity';
import { GymEntity } from 'src/gym/entities/gym.entity';
import { ManagerEntity } from 'src/manager/manager.entity';
import { MemberEntity } from 'src/member/entities/member.entity';
import { OwnerSubscriptionTypeEntity } from 'src/owner-subscriptions/owner-subscription-type.entity';
import { PTSessionEntity } from 'src/personal-trainers/entities/pt-sessions.entity';
import { ProductEntity } from 'src/products/products.entity';
import { RevenueEntity } from 'src/revenue/revenue.entity';
import {
  SubscriptionEntity,
  SubscriptionType,
} from 'src/subscription/entities/subscription.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToMany,
  ManyToOne,
  OneToOne,
  RelationId,
} from 'typeorm';
import { PgMainEntity } from '../main-classes/mainEntity';
import { ProductsOffersEntity } from 'src/products/products-offers.entity';

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

export enum Currency {
  USD = 'USD',
  LBP = 'LBP',
}

@Entity('transactions')
export class TransactionEntity extends PgMainEntity {
  @Column('text', { nullable: true })
  title: string;

  @Column('text', { nullable: true, default: TransactionType.SUBSCRIPTION })
  type: TransactionType;

  @Column('text', { nullable: true })
  subscriptionType: SubscriptionType;

  @Column('timestamp with time zone', { nullable: true })
  endDate: Date;

  @Column('timestamp with time zone', { nullable: true })
  startDate: Date;

  @Column('float')
  paidAmount: number;

  @Column('text', { default: Currency.USD })
  currency: Currency;

  @ManyToOne(() => GymEntity, (gym) => gym.transactions, {
    onDelete: 'SET NULL',
  })
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

  @Column('timestamp with time zone', { nullable: true })
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

  @Column('timestamp with time zone', { nullable: true })
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

  @Column('text', { nullable: true })
  externalId: string;
}
