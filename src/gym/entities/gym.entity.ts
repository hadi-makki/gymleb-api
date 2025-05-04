import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { CustomSchema } from '../../decorators/custom-schema.decorator';
import { MainEntity } from '../../main-classes/mainEntity';
import { Manager } from '../../manager/manager.entity';
import { PersonalTrainer } from '../../personal-trainers/entities/personal-trainer.entity';
import { Subscription } from '../../subscription/entities/subscription.entity';

@CustomSchema()
export class Gym extends MainEntity {
  @Prop({ type: String })
  name: string;

  @Prop({ type: String })
  address: string;

  @Prop({ type: String })
  phone: string;

  @Prop({ type: [Types.ObjectId], ref: 'PersonalTrainer', required: false })
  personalTrainers: PersonalTrainer[];

  @Prop({ type: [Types.ObjectId], ref: 'Subscription', required: false })
  subscriptions: Subscription[];

  @Prop({ type: Types.ObjectId, ref: 'Manager' })
  owner: Manager;

  @Prop({ type: Boolean, default: false })
  finishedPageSetup: boolean;

  @Prop({
    type: [
      {
        day: String,
        openingTime: String,
        closingTime: String,
        isOpen: Boolean,
      },
    ],
    required: false,
  })
  openingDays: {
    day: string;
    openingTime: string;
    closingTime: string;
    isOpen: boolean;
  }[];

  @Prop({ type: Number, default: 0 })
  membersNotified: number;
}

export const GymSchema = SchemaFactory.createForClass(Gym);
