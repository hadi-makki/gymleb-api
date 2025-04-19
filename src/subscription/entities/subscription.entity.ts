import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { CustomSchema } from 'src/decorators/custom-schema.decorator';
import { Gym } from 'src/gym/entities/gym.entity';
import { PersonalTrainer } from 'src/personal-trainers/entities/personal-trainer.entity';
import { User } from 'src/user/user.entity';

export enum SubscriptionType {
  PERSONAL_TRAINER = 'personal_trainer',
  MONTHLY_GYM = 'monthly_gym',
  YEARLY_GYM = 'yearly_gym',
  DAILY_GYM = 'daily_gym',
}

@CustomSchema()
export class Subscription {
  @Prop({ type: String })
  title: string;

  @Prop({ type: String, enum: SubscriptionType })
  type: SubscriptionType;

  @Prop({ type: Number })
  price: number;

  @Prop({ type: Number })
  duration: number;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  user: User;

  @Prop({ type: Types.ObjectId, ref: 'Gym', required: false })
  gym: Gym;
}

export const SubscriptionSchema = SchemaFactory.createForClass(Subscription);
