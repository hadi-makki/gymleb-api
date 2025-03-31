import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { MainEntity } from 'src/main-classes/mainEntity';
import { Manager } from 'src/manager/manager.entity';
import { User } from 'src/user/user.entity';

export enum TokenType {
  Access = 'access',
  Refresh = 'refresh',
  ResetPassword = 'reset-password',
}

@Schema({ timestamps: true })
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

  @Prop({ type: Types.ObjectId, ref: 'Manager', nullable: true })
  manager: Manager;
}

export const TokenSchema = SchemaFactory.createForClass(Token);
export default Token;
