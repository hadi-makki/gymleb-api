import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { MainEntity } from 'src/main-classes/mainEntity';
import { Manager } from 'src/manager/manager.entity';
import { User } from 'src/user/user.entity';
import { Gym } from 'src/gym/entities/gym.entity';

@Schema()
export class PersonalTrainer extends Manager {
  @Prop({ required: true, type: [Types.ObjectId], ref: 'User' })
  users: User[];

  @Prop({ type: Types.ObjectId, ref: 'Gym', required: false })
  gym: Gym;
}

export const PersonalTrainerSchema =
  SchemaFactory.createForClass(PersonalTrainer);
