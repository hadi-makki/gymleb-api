import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';
import { Types } from 'mongoose';
import { CustomSchema } from 'src/decorators/custom-schema.decorator';
import { Role } from 'src/decorators/roles/role.enum';
import { MainEntity } from 'src/main-classes/mainEntity';
import Token from 'src/token/token.entity';

@CustomSchema()
export class Manager extends MainEntity {
  @Prop({ required: true, unique: true })
  username: string;

  @Prop({ required: true })
  password: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Token' }] })
  tokens: Token[];

  @Prop({ type: [String], enum: Role, default: [Role.Any] })
  roles: Role[];

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
