import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { MainEntity } from 'src/main-classes/mainEntity';
import * as bcrypt from 'bcryptjs';
import Token from 'src/token/token.entity';
import { Transaction } from 'src/transactions/transaction.entity';
import { PersonalTrainer } from 'src/personal-trainers/entities/personal-trainer.entity';
import { Gym } from 'src/gym/entities/gym.entity';
import { Subscription } from 'src/subscription/entities/subscription.entity';
import { CustomSchema } from 'src/decorators/custom-schema.decorator';

export type UserDocument = User & Document;

@CustomSchema()
export class User extends MainEntity {
  @Prop({ required: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true, type: Types.ObjectId, ref: 'PersonalTrainer' })
  personalTrainer: PersonalTrainer;

  @Prop({ type: Types.ObjectId, ref: 'Gym', required: false })
  gym: Gym;

  @Prop({ type: Types.ObjectId, ref: 'Subscription', required: false })
  subscription: Subscription;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Token' }], default: [] })
  tokens: Token[];

  @Prop({ type: [Transaction], default: [], ref: 'Transaction' })
  transactions: Transaction[];

  async comparePassword(oldPassword: string) {
    return await bcrypt.compare(oldPassword, this.password);
  }
}

export const UserSchema = SchemaFactory.createForClass(User);
