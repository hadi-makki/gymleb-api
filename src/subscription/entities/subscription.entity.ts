import { CustomSchema } from '../../decorators/custom-schema.decorator';
import { Column, Entity, ManyToOne, OneToMany, RelationId } from 'typeorm';
import { PgMainEntity } from 'src/main-classes/mainEntity';
import { GymEntity } from 'src/gym/entities/gym.entity';
import { SubscriptionInstanceEntity } from 'src/transactions/subscription-instance.entity';
import { TransactionEntity } from 'src/transactions/transaction.entity';
import { MemberEntity } from 'src/member/entities/member.entity';

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

  @Column('text', { nullable: true })
  user: string;

  @ManyToOne(() => GymEntity, (gym) => gym.subscriptions, { nullable: true })
  gym: GymEntity;

  @RelationId((subscription: SubscriptionEntity) => subscription.gym)
  gymId: string | null;

  @OneToMany(
    () => SubscriptionInstanceEntity,
    (instance) => instance.subscription,
  )
  instances: SubscriptionInstanceEntity[];

  @OneToMany(() => TransactionEntity, (transaction) => transaction.subscription)
  transactions: TransactionEntity[];

  @OneToMany(() => MemberEntity, (member) => member.subscription)
  members: MemberEntity[];
}
