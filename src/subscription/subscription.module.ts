import { Module } from '@nestjs/common';
import { SubscriptionService } from './subscription.service';
import { SubscriptionController } from './subscription.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Gym, GymSchema } from '../gym/entities/gym.entity';
import {
  Subscription,
  SubscriptionSchema,
} from './entities/subscription.entity';
import { AuthenticationModule } from '../common/AuthModule.module';

@Module({
  imports: [
    AuthenticationModule,
    MongooseModule.forFeature([
      { name: Subscription.name, schema: SubscriptionSchema },
      { name: Gym.name, schema: GymSchema },
    ]),
  ],
  controllers: [SubscriptionController],
  providers: [SubscriptionService],
})
export class SubscriptionModule {}
