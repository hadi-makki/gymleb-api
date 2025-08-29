import { CustomSchema } from '../decorators/custom-schema.decorator';
import { MainEntity, PgMainEntity } from '../main-classes/mainEntity';
import { Column, Entity, OneToMany } from 'typeorm';
import { OwnerSubscriptionEntity } from './owner-subscription.entity';
import { TransactionEntity } from 'src/transactions/transaction.entity';
import { SubscriptionInstanceEntity } from 'src/transactions/subscription-instance.entity';

@Entity('owner_subscription_types')
export class OwnerSubscriptionTypeEntity extends PgMainEntity {
  @Column('text', { nullable: true })
  title: string;

  @Column('int', { nullable: true })
  price: number;

  @Column('int', { nullable: true })
  durationDays: number;

  @Column('text', { nullable: true })
  description?: string;

  @OneToMany(
    () => OwnerSubscriptionEntity,
    (ownerSubscription) => ownerSubscription.type,
  )
  ownerSubscription: OwnerSubscriptionEntity[];

  @OneToMany(
    () => TransactionEntity,
    (transaction) => transaction.ownerSubscriptionType,
  )
  transactions: TransactionEntity[];

  @OneToMany(
    () => SubscriptionInstanceEntity,
    (subscriptionInstance) => subscriptionInstance.ownerSubscriptionType,
  )
  instances: SubscriptionInstanceEntity[];
}
