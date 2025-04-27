import { Prop } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { CustomSchema } from '../decorators/custom-schema.decorator';

export type MainDocument = MainEntity & Document;

@CustomSchema()
export class MainEntity extends Document {
  id: string;
  @Prop({ required: true, default: Date.now })
  createdAt: Date;

  @Prop({ required: true, default: Date.now })
  updatedAt: Date;

  @Prop({ required: true, default: false })
  isDeactivated: boolean;
}
