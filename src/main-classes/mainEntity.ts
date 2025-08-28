import { Prop } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { CustomSchema } from '../decorators/custom-schema.decorator';
import {
  CreateDateColumn,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

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

export class PgMainEntity extends MainEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt: Date;
}
