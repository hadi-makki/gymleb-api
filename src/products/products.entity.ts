import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { CustomSchema } from '../decorators/custom-schema.decorator';
import { Transaction } from '../transactions/transaction.entity';

export type ProductDocument = Product & Document;

@CustomSchema()
export class Product {
  @Prop({ type: String, required: true })
  name: string;

  @Prop({ type: String, required: false })
  stripeProductId: string;

  @Prop({ type: Number, required: true })
  price: number;

  @Prop({
    type: [{ type: Types.ObjectId, ref: 'Transaction' }],
    default: [],
  })
  transactions: Transaction[];

  @Prop({ type: Number, default: 600 })
  maxDurationSeconds: number;
}

export const ProductSchema = SchemaFactory.createForClass(Product);
