import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { MainEntity } from '../../main-classes/mainEntity';
import { Gym } from '../../gym/entities/gym.entity';
import { Types } from 'mongoose';
import { Subscription } from '../../subscription/entities/subscription.entity';
import { CustomSchema } from '../../decorators/custom-schema.decorator';
import { SubscriptionInstance } from '../../transactions/subscription-instance.entity';
import { Transaction } from 'src/transactions/transaction.entity';

@CustomSchema()
export class Member extends MainEntity {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true })
  username: string;

  @Prop({ required: false })
  email: string;

  @Prop({ required: true })
  phone: string;

  @Prop({ ref: 'Gym', type: Types.ObjectId, required: true })
  gym: Gym;

  @Prop({ required: true, type: Types.ObjectId, ref: 'Subscription' })
  subscription: Subscription;

  @Prop({
    ref: 'SubscriptionInstance',
    type: [Types.ObjectId],
    required: false,
  })
  subscriptionInstances: SubscriptionInstance[];

  @Prop({
    ref: 'Transaction',
    type: [Types.ObjectId],
    required: false,
    default: [],
  })
  transactions: Transaction[];

  @Prop({ type: String, required: false })
  passCode: string;

  @Prop({ type: Boolean, default: false })
  isNotified: boolean;

  @Prop({ type: String, required: false })
  profileImage: string;
}

export const MemberSchema = SchemaFactory.createForClass(Member);
