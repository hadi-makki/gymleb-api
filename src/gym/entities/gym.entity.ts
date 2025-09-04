import { ExpenseEntity } from 'src/expenses/expense.entity';
import { ManagerEntity } from 'src/manager/manager.entity';
import { MemberEntity } from 'src/member/entities/member.entity';
import { PTSessionEntity } from 'src/personal-trainers/entities/pt-sessions.entity';
import { ProductEntity } from 'src/products/products.entity';
import { RevenueEntity } from 'src/revenue/revenue.entity';
import { SubscriptionEntity } from 'src/subscription/entities/subscription.entity';
import { TransactionEntity } from 'src/transactions/transaction.entity';
import { GymPresetEntity } from './gym-preset.entity';
import { MemberReservationEntity } from '../../member/entities/member-reservation.entity';
import {
  Column,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  RelationId,
} from 'typeorm';
import { PgMainEntity } from '../../main-classes/mainEntity';
export enum GymTypeEnum {
  FITNESS = 'fitness',
  CALISTHENICS = 'calisthenics',
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
  email: string;

  @Column('text')
  phone: string;

  @ManyToMany(() => ManagerEntity, (manager) => manager.gyms)
  personalTrainers: ManagerEntity[];

  @OneToMany(() => SubscriptionEntity, (subscription) => subscription.gym)
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

  @Column('jsonb', { default: [] })
  offers: { description: string }[];

  @Column('int', { default: 10 })
  gymsPTSessionPercentage: number;

  @Column('boolean', { default: false })
  isDeactivated: boolean;

  @Column('boolean', { default: false })
  showPersonalTrainers: boolean;

  @OneToMany(() => ProductEntity, (product) => product.gym)
  products: ProductEntity[];

  @OneToMany(() => MemberEntity, (member) => member.gym)
  members: MemberEntity[];

  @OneToMany(() => RevenueEntity, (revenue) => revenue.gym)
  revenues: RevenueEntity[];

  @OneToMany(() => ExpenseEntity, (expense) => expense.gym)
  expenses: ExpenseEntity[];

  @OneToMany(() => PTSessionEntity, (session) => session.gym)
  ptSessions: PTSessionEntity[];

  @OneToMany(() => GymPresetEntity, (preset) => preset.gym)
  presets: GymPresetEntity[];

  @OneToMany(() => MemberReservationEntity, (reservation) => reservation.gym)
  reservations: MemberReservationEntity[];

  @Column('text', { nullable: true, default: GymTypeEnum.FITNESS })
  gymType: GymTypeEnum;

  @Column('boolean', { default: false })
  allowUserSignUp: boolean;

  @Column('boolean', { default: false })
  allowUserResevations: boolean;

  @Column('int', { default: 0 })
  allowedUserResevationsPerSession: number;

  @Column('decimal', { default: 1 })
  sessionTimeInHours: number;
}
