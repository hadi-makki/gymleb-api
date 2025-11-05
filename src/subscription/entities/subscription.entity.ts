import { CustomSchema } from '../../decorators/custom-schema.decorator';
import { Column, Entity, ManyToOne, OneToMany, RelationId } from 'typeorm';
import { PgMainEntity } from 'src/main-classes/mainEntity';
import { GymEntity } from 'src/gym/entities/gym.entity';
import { TransactionEntity } from 'src/transactions/transaction.entity';
import { MemberEntity } from 'src/member/entities/member.entity';
import { Currency } from 'src/common/enums/currency.enum';

export enum SubscriptionType {
  MONTHLY_GYM = 'monthly_gym',
  YEARLY_GYM = 'yearly_gym',
  DAILY_GYM = 'daily_gym',
  WEEKLY_GYM = 'weekly_gym',
}

@Entity('subscriptions')
export class SubscriptionEntity extends PgMainEntity {
  @Column('text')
  title: string;

  @Column('text')
  type: SubscriptionType;

  @Column('float')
  price: number;

  @Column('int')
  duration: number;

  // Number of PT sessions included with this subscription. If null or undefined, no PT sessions are bundled.
  @Column('int', { nullable: true })
  ptSessionsCount: number | null;

  @Column('text', { nullable: true })
  user: string;

  @ManyToOne(() => GymEntity, (gym) => gym.subscriptions, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  gym: GymEntity;

  @RelationId((subscription: SubscriptionEntity) => subscription.gym)
  gymId: string | null;

  @OneToMany(() => TransactionEntity, (transaction) => transaction.subscription)
  transactions: TransactionEntity[];

  @OneToMany(() => MemberEntity, (member) => member.subscription)
  members: MemberEntity[];

  @Column('text', { nullable: true })
  currency: Currency;
}
