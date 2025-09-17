import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
  RelationId,
} from 'typeorm';
import { ManagerEntity } from '../../manager/manager.entity';
import { OwnerSubscriptionTypeEntity } from '../../owner-subscriptions/owner-subscription-type.entity';

export type WhishStatus = 'pending' | 'success' | 'failed' | 'created';

@Entity('whish_transactions')
export class WhishTransaction {
  @PrimaryGeneratedColumn()
  id: number;

  // externalId used with WHISH API (long from your side)
  @Index()
  @Column({ type: 'varchar', length: 128, nullable: false })
  externalId: string;

  @Column({ type: 'varchar', length: 64, nullable: true })
  orderId?: string; // your internal order id or reference

  @Column({ type: 'decimal', precision: 18, scale: 6 })
  amount: number;

  @Column({ type: 'varchar', length: 8, default: 'USD' })
  currency: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  invoice?: string;

  @Column({ type: 'varchar', length: 1024, nullable: true })
  whishUrl?: string;

  @Column({ type: 'varchar', length: 32, default: 'created' })
  status: WhishStatus;

  @Column({ type: 'json', nullable: true })
  rawResponse?: any; // store last raw response from WHISH for debugging

  // Owner/Manager who initiated the payment
  @ManyToOne(() => ManagerEntity)
  @JoinColumn({ name: 'ownerId' })
  owner?: ManagerEntity;

  @RelationId((transaction: WhishTransaction) => transaction.owner)
  ownerId?: string;

  // Subscription type being purchased
  @ManyToOne(() => OwnerSubscriptionTypeEntity)
  @JoinColumn({ name: 'subscriptionTypeId' })
  subscriptionType?: OwnerSubscriptionTypeEntity;

  @RelationId((transaction: WhishTransaction) => transaction.subscriptionType)
  subscriptionTypeId?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
