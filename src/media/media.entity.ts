import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { CustomSchema } from '../decorators/custom-schema.decorator';
import { User } from '../user/user.entity';
import { Manager } from '../manager/manager.model';

@CustomSchema()
export class Media extends Document {
  @Prop({ required: true })
  s3Key: string;

  @Prop({ required: true })
  originalName: string;

  @Prop({ nullable: true, default: null })
  fileName: string;

  @Prop({ type: Number })
  size: number;

  @Prop({ required: true })
  mimeType: string;

  @Prop({ type: Types.ObjectId, ref: 'User', nullable: true })
  user: User;

  @Prop({ type: Types.ObjectId, ref: 'Manager', nullable: true })
  manager: Manager;
}

export const MediaSchema = SchemaFactory.createForClass(Media);
