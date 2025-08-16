import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { CustomSchema } from '../decorators/custom-schema.decorator';
import { MainEntity } from '../main-classes/mainEntity';
import { Product } from '../products/products.entity';
import { User } from '../user/user.entity';
import { Gym } from '../gym/entities/gym.entity';
import { Subscription } from '../subscription/entities/subscription.entity';
import { Member } from '../member/entities/member.entity';
import { Manager } from '../manager/manager.entity';
import { OwnerSubscriptionType } from '../owner-subscriptions/owner-subscription-type.entity';
export type SubscriptionInstanceDocument = SubscriptionInstance & Document;

@CustomSchema()
export class SubscriptionInstance extends MainEntity {
  @Prop({ type: String, required: false })
  endDate: string;

  @Prop({ type: String, required: false })
  startDate: string;

  @Prop({ type: Number, required: false })
  paidAmount: number;

  @Prop({ type: Types.ObjectId, required: false, ref: 'Gym' })
  gym: Gym;

  @Prop({ type: Types.ObjectId, required: false, ref: 'Subscription' })
  subscription: Subscription;

  @Prop({ type: Types.ObjectId, required: false, ref: 'Member' })
  member: Member;

  // Owner subscription assignment transaction
  @Prop({ type: Types.ObjectId, required: false, ref: 'Manager' })
  owner: Manager;

  @Prop({
    type: Types.ObjectId,
    required: false,
    ref: 'OwnerSubscriptionType',
  })
  ownerSubscriptionType: OwnerSubscriptionType;

  @Prop({ type: Boolean, required: false, default: false })
  isOwnerSubscriptionAssignment: boolean;

  @Prop({ type: String, required: false })
  paidBy: string;

  @Prop({ type: Boolean, required: false, default: false })
  isInvalidated: boolean;
}

export const SubscriptionInstanceSchema =
  SchemaFactory.createForClass(SubscriptionInstance);
