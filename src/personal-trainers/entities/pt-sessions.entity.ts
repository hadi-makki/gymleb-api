import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { CustomSchema } from '../../decorators/custom-schema.decorator';

import { Member } from 'src/member/entities/member.entity';
import { Gym } from 'src/gym/entities/gym.entity';
import { MainEntity } from 'src/main-classes/mainEntity';
import { Manager } from 'src/manager/manager.entity';

@CustomSchema()
export class PTSession extends MainEntity {
  @Prop({ required: true, type: Types.ObjectId, ref: 'Manager' })
  personalTrainer: Manager;

  @Prop({ required: true, type: Types.ObjectId, ref: 'Member' })
  member: Member;

  @Prop({ required: false })
  sessionDate: Date;

  @Prop({ required: true, default: false })
  isCancelled: boolean;

  @Prop({ required: false, default: '' })
  cancelledReason: string;

  @Prop({ required: false, default: null })
  cancelledAt: Date;

  @Prop({ ref: 'Gym', required: true, type: Types.ObjectId })
  gym: Gym;

  @Prop({ required: false, default: null })
  sessionPrice: number;
}

export const PTSessionSchema = SchemaFactory.createForClass(PTSession);
