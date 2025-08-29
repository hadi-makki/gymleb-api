import { GymEntity } from 'src/gym/entities/gym.entity';
import { TransactionEntity } from 'src/transactions/transaction.entity';
import { Column, Entity, ManyToOne, RelationId } from 'typeorm';
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

  @ManyToOne(() => GymEntity, (gym) => gym.expenses)
  gym: GymEntity;

  @RelationId((expense: ExpenseEntity) => expense.gym)
  gymId: string | null;

  @ManyToOne(() => TransactionEntity, (transaction) => transaction.expense)
  transaction: TransactionEntity;

  @RelationId((expense: ExpenseEntity) => expense.transaction)
  transactionId: string | null;
}
