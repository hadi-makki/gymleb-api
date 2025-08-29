import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { CustomSchema } from '../decorators/custom-schema.decorator';
import { MainEntity } from '../main-classes/mainEntity';
import { Product } from '../products/products.model';
import { User } from '../user/user.model';
import { Gym } from '../gym/entities/gym.model';
import {
  Subscription,
  SubscriptionType,
} from '../subscription/entities/subscription.model';
import { Member } from '../member/entities/member.model';
import { Manager } from '../manager/manager.model';
import { OwnerSubscriptionType } from '../owner-subscriptions/owner-subscription-type.model';
import { Revenue } from '../revenue/revenue.model';
import { Expense } from '../expenses/expense.model';
export type TransactionDocument = Transaction & Document;

export enum TransactionType {
  SUBSCRIPTION = 'subscription',
  OWNER_SUBSCRIPTION_ASSIGNMENT = 'owner_subscription_assignment',
  REVENUE = 'revenue',
  EXPENSE = 'expense',
  PERSONAL_TRAINER_SESSION = 'personal_trainer_session',
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

  @Prop({ type: Date, required: false })
  endDate: Date;

  @Prop({ type: Date, required: false })
  startDate: Date;

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

  @Prop({ type: Types.ObjectId, required: false, ref: 'Manager' })
  personalTrainer: Manager;

  @Prop({ type: Number, required: false })
  gymsPTSessionPercentage: number;
}

export const TransactionSchema = SchemaFactory.createForClass(Transaction);
