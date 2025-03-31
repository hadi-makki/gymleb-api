import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  GymOwner,
  GymOwnerSchema,
} from 'src/gym-owner/entities/gym-owner.entity';
import { Gym, GymSchema } from './entities/gym.entity';
import { GymController } from './gym.controller';
import { GymService } from './gym.service';
import { Manager, ManagerSchema } from 'src/manager/manager.entity';
import { AuthenticationModule } from 'src/common/AuthModule.module';

@Module({
  imports: [
    AuthenticationModule,
    MongooseModule.forFeature([
      { name: Gym.name, schema: GymSchema },
      { name: GymOwner.name, schema: GymOwnerSchema },
    ]),
  ],
  controllers: [GymController],
  providers: [GymService],
})
export class GymModule {}
