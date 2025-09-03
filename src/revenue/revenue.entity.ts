import { GymEntity } from 'src/gym/entities/gym.entity';
import { TransactionEntity } from 'src/transactions/transaction.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  RelationId,
} from 'typeorm';
import { PgMainEntity } from '../main-classes/mainEntity';

@Entity('revenues')
export class RevenueEntity extends PgMainEntity {
  @Column('text')
  title: string;

  @Column('decimal', { default: 0 })
  amount: number;

  @Column('timestamp with time zone')
  date: Date;

  @Column('text', { nullable: true })
  category?: string;

  @Column('text', { nullable: true })
  notes?: string;

  @ManyToOne(() => GymEntity, (gym) => gym.revenues)
  gym: GymEntity;

  @RelationId((revenue: RevenueEntity) => revenue.gym)
  gymId: string | null;

  @OneToOne(() => TransactionEntity, (transaction) => transaction.revenue, {
    onDelete: 'CASCADE',
  })
  @JoinColumn()
  transaction: TransactionEntity;
}
