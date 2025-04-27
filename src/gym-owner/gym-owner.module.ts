import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthenticationModule } from '../common/AuthModule.module';
import { GymOwner, GymOwnerSchema } from './entities/gym-owner.entity';
import { GymOwnerController } from './gym-owner.controller';
import { GymOwnerService } from './gym-owner.service';
import { Gym, GymSchema } from '../gym/entities/gym.entity';
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: GymOwner.name, schema: GymOwnerSchema },
      { name: Gym.name, schema: GymSchema },
    ]),
    AuthenticationModule,
  ],
  controllers: [GymOwnerController],
  providers: [GymOwnerService],
})
export class GymOwnerModule {}
