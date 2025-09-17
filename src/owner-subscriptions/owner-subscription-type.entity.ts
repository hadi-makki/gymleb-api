import { GymEntity } from 'src/gym/entities/gym.entity';
import { TransactionEntity } from 'src/transactions/transaction.entity';
import { Column, Entity, OneToMany } from 'typeorm';
import { PgMainEntity } from '../main-classes/mainEntity';
import { WhishTransaction } from '../whish-transactions/entities/whish-transaction.entity';

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
    () => TransactionEntity,
    (transaction) => transaction.ownerSubscriptionType,
    {
      onDelete: 'SET NULL',
    },
  )
  transactions: TransactionEntity[];

  @Column('int', { nullable: true })
  allowedNotificationsNumber: number;

  @OneToMany(() => GymEntity, (gym) => gym.ownerSubscriptionType, {
    onDelete: 'SET NULL',
  })
  gyms: GymEntity[];

  @OneToMany(
    () => WhishTransaction,
    (transaction) => transaction.subscriptionType,
    {
      onDelete: 'SET NULL',
    },
  )
  whishTransactions: WhishTransaction[];

  @Column('boolean', { default: false })
  isTurnedOnForUsers: boolean;
}
