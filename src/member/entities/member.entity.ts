import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { MainEntity } from '../../main-classes/mainEntity';
import { Gym } from '../../gym/entities/gym.model';
import { Types } from 'mongoose';
import { Subscription } from '../../subscription/entities/subscription.model';
import { CustomSchema } from '../../decorators/custom-schema.decorator';
import { SubscriptionInstance } from '../../transactions/subscription-instance.entity';
import { Transaction } from '../../transactions/transaction.entity';
import { PTSession } from 'src/personal-trainers/entities/pt-sessions.entity';
import * as bcrypt from 'bcrypt';

@CustomSchema()
export class Member extends MainEntity {
  @Prop({ required: true })
  name: string;

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

  @Prop({ type: Boolean, default: false })
  isNotified: boolean;

  @Prop({ type: String, required: false })
  profileImage: string;

  @Prop({ required: false, type: [{ type: Types.ObjectId, ref: 'PTSession' }] })
  sessions: PTSession[];

  @Prop({ required: false, type: String })
  password: string | null;

  @Prop({ type: Boolean, default: false })
  isWelcomeMessageSent: boolean;

  static async isPasswordMatch(
    password: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }
}

export const MemberSchema = SchemaFactory.createForClass(Member);
