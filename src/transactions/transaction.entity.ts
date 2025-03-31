import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { MainEntity } from 'src/main-classes/mainEntity';
import { Product } from 'src/products/products.entity';
import { User } from 'src/user/user.entity';

export type TransactionDocument = Transaction & Document;

@Schema({ collection: 'transactions' })
export class Transaction extends MainEntity {
  @Prop({ type: String, required: false })
  invoiceId: string;

  @Prop({ type: Date, required: true })
  invoiceDate: Date;

  @Prop({ type: String, required: false })
  status: string;

  @Prop({ type: Product, required: false, ref: 'Product' })
  product: Product;

  @Prop({ type: Types.ObjectId, required: true, ref: 'User' })
  user: User;
}

export const TransactionSchema = SchemaFactory.createForClass(Transaction);
