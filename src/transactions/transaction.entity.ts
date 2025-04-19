import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { CustomSchema } from 'src/decorators/custom-schema.decorator';
import { MainEntity } from 'src/main-classes/mainEntity';
import { Product } from 'src/products/products.entity';
import { User } from 'src/user/user.entity';
import { Gym } from 'src/gym/entities/gym.entity';
import { Subscription } from 'src/subscription/entities/subscription.entity';
import { Member } from 'src/member/entities/member.entity';
export type TransactionDocument = Transaction & Document;

@CustomSchema()
export class Transaction extends MainEntity {
  @Prop({ type: String, required: false })
  endDate: string;

  @Prop({ type: Types.ObjectId, required: false, ref: 'Gym' })
  gym: Gym;

  @Prop({ type: Types.ObjectId, required: false, ref: 'Subscription' })
  subscription: Subscription;

  @Prop({ type: Types.ObjectId, required: false, ref: 'Member' })
  member: Member;
}

export const TransactionSchema = SchemaFactory.createForClass(Transaction);
