import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { MainEntity } from 'src/main-classes/mainEntity';
import { Gym } from 'src/gym/entities/gym.entity';
import { Types } from 'mongoose';
import { Subscription } from 'src/subscription/entities/subscription.entity';
import { CustomSchema } from 'src/decorators/custom-schema.decorator';
import { Transaction } from 'src/transactions/transaction.entity';

@CustomSchema()
export class Member extends MainEntity {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  email: string;

  @Prop({ required: true })
  phone: string;

  @Prop({ ref: 'Gym', type: Types.ObjectId, required: true })
  gym: Gym;

  @Prop({ required: true, type: Types.ObjectId, ref: 'Subscription' })
  subscription: Subscription;

  @Prop({ ref: 'Transaction', type: [Types.ObjectId], required: false })
  transactions: Transaction[];
}

export const MemberSchema = SchemaFactory.createForClass(Member);
