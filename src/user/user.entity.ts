import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { MainEntity } from 'src/main-classes/mainEntity';
import * as bcrypt from 'bcryptjs';
import Token from 'src/token/token.entity';
import { Transaction } from 'src/transactions/transaction.entity';

export type UserDocument = User & Document;

@Schema({ collection: 'user', timestamps: true })
export class User extends MainEntity {
  @Prop({ required: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ required: true })
  name: string;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Token' }], default: [] })
  tokens: Token[];

  @Prop({ type: [Transaction], default: [], ref: 'Transaction' })
  transactions: Transaction[];

  async comparePassword(oldPassword: string) {
    return await bcrypt.compare(oldPassword, this.password);
  }
}

export const UserSchema = SchemaFactory.createForClass(User);
