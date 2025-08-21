import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { CustomSchema } from '../decorators/custom-schema.decorator';
import { MainEntity } from '../main-classes/mainEntity';
import { Product } from '../products/products.entity';
import { User } from '../user/user.entity';
import { Gym } from '../gym/entities/gym.entity';
import {
  Subscription,
  SubscriptionType,
} from '../subscription/entities/subscription.entity';
import { Member } from '../member/entities/member.entity';
import { Manager } from '../manager/manager.entity';
import { OwnerSubscriptionType } from '../owner-subscriptions/owner-subscription-type.entity';
import { Revenue } from '../revenue/revenue.entity';
import { Expense } from '../expenses/expense.entity';
export type TransactionDocument = Transaction & Document;

export enum TransactionType {
  SUBSCRIPTION = 'subscription',
  OWNER_SUBSCRIPTION_ASSIGNMENT = 'owner_subscription_assignment',
  REVENUE = 'revenue',
  EXPENSE = 'expense',
}

export enum Currency {
  USD = 'USD',
  LBP = 'LBP',
}

@CustomSchema()
export class Transaction extends MainEntity {
  @Prop({ type: String, required: false })
  title: string;

  @Prop({ type: String, required: false, enum: TransactionType })
  type: TransactionType;

  @Prop({ type: String, required: false, enum: SubscriptionType })
  subscriptionType: SubscriptionType;

  @Prop({ type: String, required: false })
  endDate: string;

  @Prop({ type: String, required: false })
  startDate: string;

  @Prop({ type: Number, required: false })
  paidAmount: number;

  @Prop({
    type: String,
    required: false,
    enum: Currency,
    default: Currency.USD,
  })
  currency: Currency;

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

  @Prop({ type: Date, required: false })
  invalidatedAt: Date;

  @Prop({ type: Types.ObjectId, required: false, ref: 'Product' })
  product: Product;

  @Prop({ type: Number, required: false })
  numberSold: number;

  @Prop({ type: Types.ObjectId, required: false, ref: 'Revenue' })
  revenue: Revenue;

  @Prop({ type: Types.ObjectId, required: false, ref: 'Expense' })
  expense: Expense;

  @Prop({ type: Date, required: false })
  date: Date;
}

export const TransactionSchema = SchemaFactory.createForClass(Transaction);
