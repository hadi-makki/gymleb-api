import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { User } from 'src/user/user.entity';

@Schema({ collection: 'media' })
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

  @Prop({ type: Types.ObjectId, ref: 'User' })
  user: User;
}

export const MediaSchema = SchemaFactory.createForClass(Media);
