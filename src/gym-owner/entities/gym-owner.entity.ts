import { Gym } from '../../gym/entities/gym.entity';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { Manager } from '../../manager/manager.entity';

@Schema()
export class GymOwner extends Manager {
  @Prop({ type: [Types.ObjectId], ref: 'Gym', required: false })
  gyms: Gym[];
}

export const GymOwnerSchema = SchemaFactory.createForClass(GymOwner);
