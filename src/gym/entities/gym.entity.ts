import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { GymOwner } from 'src/gym-owner/entities/gym-owner.entity';
import { PersonalTrainer } from 'src/personal-trainers/entities/personal-trainer.entity';
import { Subscription } from 'src/subscription/entities/subscription.entity';

@Schema()
export class Gym {
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

  @Prop({ type: Types.ObjectId, ref: 'GymOwner' })
  gymOwner: GymOwner;
}

export const GymSchema = SchemaFactory.createForClass(Gym);
