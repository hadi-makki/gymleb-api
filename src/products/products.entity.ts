import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { CustomSchema } from '../decorators/custom-schema.decorator';
import { SubscriptionInstance } from '../transactions/subscription-instance.entity';
import { Media } from '../media/media.entity';
import { Gym } from '../gym/entities/gym.model';
import { MainEntity } from '../main-classes/mainEntity';
import { Transaction } from '../transactions/transaction.entity';

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

  @Prop({ type: Number, default: 0 })
  stock: number;
}

export const ProductSchema = SchemaFactory.createForClass(Product);
