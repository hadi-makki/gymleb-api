import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { CustomSchema } from '../decorators/custom-schema.decorator';
import { MainEntity } from '../main-classes/mainEntity';
import { Product } from '../products/products.entity';
import { User } from '../user/user.entity';
import { Gym } from '../gym/entities/gym.entity';
import { Subscription } from '../subscription/entities/subscription.entity';
import { Member } from '../member/entities/member.entity';
export type TransactionDocument = Transaction & Document;

@CustomSchema()
export class Transaction extends MainEntity {
  @Prop({ type: String, required: false })
  endDate: string;

  @Prop({ type: Number, required: false })
  paidAmount: number;

  @Prop({ type: Types.ObjectId, required: false, ref: 'Gym' })
  gym: Gym;

  @Prop({ type: Types.ObjectId, required: false, ref: 'Subscription' })
  subscription: Subscription;

  @Prop({ type: Types.ObjectId, required: false, ref: 'Member' })
  member: Member;
}

export const TransactionSchema = SchemaFactory.createForClass(Transaction);
