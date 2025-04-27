import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { CustomSchema } from '../decorators/custom-schema.decorator';
import { MainEntity } from '../main-classes/mainEntity';
import { Manager } from '../manager/manager.entity';
import { Member } from '../member/entities/member.entity';
import { User } from '../user/user.entity';

export enum TokenType {
  Access = 'access',
  Refresh = 'refresh',
  ResetPassword = 'reset-password',
}

@CustomSchema()
class Token extends MainEntity {
  @Prop({ type: String, unique: true, default: null })
  accessToken: string;

  @Prop({ type: String, unique: true, default: null })
  refreshToken: string;

  @Prop({ type: Date, default: null })
  refreshExpirationDate: Date;

  @Prop({ type: Date, default: null })
  accessExpirationDate: Date;

  @Prop({ type: String, default: null })
  deviceId: string;

  @Prop({ type: Types.ObjectId, ref: 'User', nullable: true })
  user: User;

  @Prop({ type: Types.ObjectId, ref: 'Member', nullable: true })
  member: Member;

  @Prop({ type: Types.ObjectId, ref: 'Manager', nullable: true })
  manager: Manager;
}

export const TokenSchema = SchemaFactory.createForClass(Token);
export default Token;
