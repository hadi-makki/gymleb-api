import { GymEntity } from 'src/gym/entities/gym.entity';
import { TransactionEntity } from 'src/transactions/transaction.entity';
import {
  Column,
  Entity,
  ManyToOne,
  OneToOne,
  RelationId,
  JoinColumn,
} from 'typeorm';
import { PgMainEntity } from '../main-classes/mainEntity';

@Entity('expenses')
export class ExpenseEntity extends PgMainEntity {
  @Column('text')
  title: string;

  @Column('int')
  amount: number;

  @Column('timestamp with time zone')
  date: Date;

  @Column('text', { nullable: true })
  category?: string;

  @Column('text', { nullable: true })
  notes?: string;

  @ManyToOne(() => GymEntity, (gym) => gym.expenses, {
    onDelete: 'CASCADE',
  })
  gym: GymEntity;

  @RelationId((expense: ExpenseEntity) => expense.gym)
  gymId: string | null;

  @OneToOne(() => TransactionEntity, (transaction) => transaction.expense, {
    onDelete: 'CASCADE',
  })
  @JoinColumn()
  transaction: TransactionEntity;
}
