import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { CustomSchema } from '../../decorators/custom-schema.decorator';
import { MainEntity } from '../../main-classes/mainEntity';
import { Manager } from '../../manager/manager.model';
import { Subscription } from '../../subscription/entities/subscription.model';
import { SubscriptionInstance } from '../../transactions/subscription-instance.entity';
import { Transaction } from '../../transactions/transaction.entity';

@CustomSchema()
export class Gym extends MainEntity {
  @Prop({ type: String })
  name: string;

  @Prop({ type: String })
  gymDashedName: string;

  @Prop({ type: String })
  address: string;

  @Prop({ type: String })
  phone: string;

  @Prop({ type: [Types.ObjectId], ref: 'Manager', required: false })
  personalTrainers: Manager[];

  @Prop({ type: [Types.ObjectId], ref: 'Subscription', required: false })
  subscriptions: Subscription[];

  @Prop({ type: Types.ObjectId, ref: 'Manager' })
  owner: Manager;

  @Prop({
    type: [Types.ObjectId],
    ref: 'SubscriptionInstance',
    required: false,
  })
  subscriptionInstances: SubscriptionInstance[];

  @Prop({
    type: [Types.ObjectId],
    ref: 'Transaction',
    required: false,
    default: [],
  })
  transactions: Transaction[];

  @Prop({ type: Boolean, default: false })
  finishedPageSetup: boolean;

  @Prop({
    type: [
      {
        day: String,
        openingTime: String,
        closingTime: String,
        isOpen: Boolean,
      },
    ],
    required: false,
  })
  openingDays: {
    day: string;
    openingTime: string;
    closingTime: string;
    isOpen: boolean;
  }[];

  @Prop({ type: Number, default: 0 })
  membersNotified: number;

  @Prop({
    type: [
      {
        day: String,
        from: String,
        to: String,
      },
    ],
    required: false,
    default: [],
  })
  womensTimes: {
    day: string;
    from: string;
    to: string;
  }[];

  @Prop({ type: String, required: false, default: '' })
  note: string;

  @Prop({
    type: [
      {
        description: String,
      },
    ],
    required: false,
    default: [],
  })
  offers: { description: string }[];

  @Prop({ type: Number, default: 0, required: false })
  gymsPTSessionPercentage: number;
}

export const GymSchema = SchemaFactory.createForClass(Gym);
