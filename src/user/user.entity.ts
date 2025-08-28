import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { MainEntity } from '../main-classes/mainEntity';
import * as bcrypt from 'bcryptjs';
import Token from '../token/token.model';
import { SubscriptionInstance } from '../transactions/subscription-instance.entity';
import { Gym } from '../gym/entities/gym.model';
import { Subscription } from '../subscription/entities/subscription.entity';
import { CustomSchema } from '../decorators/custom-schema.decorator';
import { Transaction } from '../transactions/transaction.entity';
import { Manager } from 'src/manager/manager.model';

export type UserDocument = User & Document;

@CustomSchema()
export class User extends MainEntity {
  @Prop({ required: true })
  email: string;

  @Prop({ required: false })
  password: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true, type: Types.ObjectId, ref: 'Manager' })
  personalTrainer: Manager;

  @Prop({ type: Types.ObjectId, ref: 'Gym', required: false })
  gym: Gym;

  @Prop({ type: Types.ObjectId, ref: 'Subscription', required: false })
  subscription: Subscription;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Token' }], default: [] })
  tokens: Token[];

  @Prop({
    type: [SubscriptionInstance],
    default: [],
    ref: 'SubscriptionInstance',
  })
  subscriptionInstances: SubscriptionInstance[];

  @Prop({
    type: [Types.ObjectId],
    ref: 'Transaction',
    required: false,
    default: [],
  })
  transactions: Transaction[];

  async comparePassword(oldPassword: string) {
    return await bcrypt.compare(oldPassword, this.password);
  }
}

export const UserSchema = SchemaFactory.createForClass(User);
