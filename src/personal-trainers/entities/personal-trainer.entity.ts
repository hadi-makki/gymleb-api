import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { Manager } from '../../manager/manager.entity';
import { User } from '../../user/user.entity';
import { Gym } from '../../gym/entities/gym.entity';
import { CustomSchema } from '../../decorators/custom-schema.decorator';

@CustomSchema()
export class PersonalTrainer extends Manager {
  @Prop({ required: true, type: [Types.ObjectId], ref: 'User' })
  users: User[];

  @Prop({ type: Types.ObjectId, ref: 'Gym', required: false })
  gym: Gym;
}

export const PersonalTrainerSchema =
  SchemaFactory.createForClass(PersonalTrainer);
