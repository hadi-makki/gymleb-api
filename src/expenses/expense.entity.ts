import { Prop, SchemaFactory } from '@nestjs/mongoose';
import { Types, Document } from 'mongoose';
import { CustomSchema } from '../decorators/custom-schema.decorator';
import { MainEntity } from '../main-classes/mainEntity';
import { Gym } from '../gym/entities/gym.model';
import { Transaction } from 'src/transactions/transaction.entity';

export type ExpenseDocument = Expense & Document;

@CustomSchema()
export class Expense extends MainEntity {
  @Prop({ type: String, required: true })
  title: string;

  @Prop({ type: Number, required: true, min: 0 })
  amount: number;

  @Prop({ type: Date, required: true, default: Date.now })
  date: Date;

  @Prop({ type: String, required: false })
  category?: string;

  @Prop({ type: String, required: false })
  notes?: string;

  @Prop({ type: Types.ObjectId, ref: 'Gym', required: true })
  gym: Gym;

  @Prop({ type: Types.ObjectId, ref: 'Transaction', required: true })
  transaction: Transaction;
}

export const ExpenseSchema = SchemaFactory.createForClass(Expense);
