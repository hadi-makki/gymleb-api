import { Prop, SchemaFactory } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';
import { Types } from 'mongoose';
import { CustomSchema } from '../decorators/custom-schema.decorator';
import { Permissions } from '../decorators/roles/role.enum';
import { Gym } from '../gym/entities/gym.model';
import { MainEntity } from '../main-classes/mainEntity';
import { OwnerSubscription } from '../owner-subscriptions/owner-subscription.model';
import Token from '../token/token.model';

@CustomSchema()
export class Manager extends MainEntity {
  @Prop({ required: true, unique: true })
  username: string;

  @Prop({ required: true, default: 'John' })
  firstName: string;

  @Prop({ required: true, default: 'Doe' })
  lastName: string;

  @Prop({ required: true })
  password: string;

  @Prop({ required: true })
  phoneNumber: string;

  @Prop({ required: false })
  email: string;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Token' }] })
  tokens: Token[];

  @Prop({
    type: [String],
    enum: Permissions,
    default: [Permissions.Any],
    index: true,
  })
  roles: Permissions[];
  @Prop({ type: [{ type: Types.ObjectId, ref: 'Gym' }], required: false })
  gyms: Gym[];

  @Prop({ type: Types.ObjectId, ref: 'OwnerSubscription', required: false })
  ownerSubscription?: OwnerSubscription;

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

export const ManagerSchema = SchemaFactory.createForClass(Manager);
