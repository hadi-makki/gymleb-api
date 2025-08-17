import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { CustomSchema } from '../decorators/custom-schema.decorator';
import { SubscriptionInstance } from '../transactions/subscription-instance.entity';
import { Media } from '../media/media.entity';
import { Gym } from 'src/gym/entities/gym.entity';
import { MainEntity } from 'src/main-classes/mainEntity';
import { Transaction } from 'src/transactions/transaction.entity';

export type ProductDocument = Product & Document;

@CustomSchema()
export class Product extends MainEntity {
  @Prop({ type: String, required: true })
  name: string;

  @Prop({ type: String, required: false })
  stripeProductId: string;

  @Prop({ type: Number, required: true })
  price: number;

  @Prop({ type: String, required: false })
  description: string;

  @Prop({ type: Types.ObjectId, ref: 'Media', required: false })
  image: Media;

  @Prop({
    type: [{ type: Types.ObjectId, ref: 'SubscriptionInstance' }],
    default: [],
  })
  subscriptionInstances: SubscriptionInstance[];

  @Prop({
    type: [Types.ObjectId],
    ref: 'Transaction',
    required: false,
    default: [],
  })
  transactions: Transaction[];

  @Prop({ type: Number, default: 600 })
  maxDurationSeconds: number;

  @Prop({ type: Types.ObjectId, ref: 'Gym', required: false })
  gym: Gym;
}

export const ProductSchema = SchemaFactory.createForClass(Product);
