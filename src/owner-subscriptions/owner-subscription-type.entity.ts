import { GymEntity } from 'src/gym/entities/gym.entity';
import { TransactionEntity } from 'src/transactions/transaction.entity';
import { Column, Entity, OneToMany } from 'typeorm';
import { PgMainEntity } from '../main-classes/mainEntity';

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
  )
  transactions: TransactionEntity[];

  @Column('int', { nullable: true })
  allowedNotificationsNumber: number;

  @OneToMany(() => GymEntity, (gym) => gym.ownerSubscriptionType)
  gyms: GymEntity[];
}
