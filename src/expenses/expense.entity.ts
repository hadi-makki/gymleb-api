import { GymEntity } from 'src/gym/entities/gym.entity';
import { TransactionEntity } from 'src/transactions/transaction.entity';
import { Currency } from 'src/common/enums/currency.enum';
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

  @Column('float', { nullable: true })
  amount: number;

  @Column('int', { nullable: true })
  amountMigration?: number;

  @Column('timestamp without time zone', { nullable: true })
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

  @Column('text', { nullable: true, default: Currency.USD })
  currency?: Currency;
}
