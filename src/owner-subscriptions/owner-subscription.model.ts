import { Prop, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { CustomSchema } from '../decorators/custom-schema.decorator';
import { MainEntity } from '../main-classes/mainEntity';
import { OwnerSubscriptionType } from './owner-subscription-type.model';
import { Manager } from '../manager/manager.model';
import { Transaction } from '../transactions/transaction.model';

@CustomSchema()
export class OwnerSubscription extends MainEntity {
  @Prop({ type: Types.ObjectId, ref: 'Manager', required: true })
  owner: Manager;

  @Prop({ type: Types.ObjectId, ref: 'OwnerSubscriptionType', required: true })
  type: OwnerSubscriptionType;

  @Prop({ type: Date, required: true })
  startDate: Date;

  @Prop({ type: Date, required: true })
  endDate: Date;

  @Prop({ type: Boolean, default: true })
  active: boolean;

  // @Prop({ type: Types.ObjectId, ref: 'Transaction' })
  // transaction: Transaction;
}

export const OwnerSubscriptionSchema =
  SchemaFactory.createForClass(OwnerSubscription);
