import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { CustomSchema } from 'src/decorators/custom-schema.decorator';
import { GymOwner } from 'src/gym-owner/entities/gym-owner.entity';
import { MainEntity } from 'src/main-classes/mainEntity';
import { Manager } from 'src/manager/manager.entity';
import { PersonalTrainer } from 'src/personal-trainers/entities/personal-trainer.entity';
import { Subscription } from 'src/subscription/entities/subscription.entity';

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
}

export const GymSchema = SchemaFactory.createForClass(Gym);
