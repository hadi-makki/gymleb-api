import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TransactionModule } from '../transactions/subscription-instance.module';
import { AuthenticationModule } from '../common/AuthModule.module';
import { Gym, GymSchema } from '../gym/entities/gym.model';
import {
  Subscription,
  SubscriptionSchema,
} from './entities/subscription.entity';
import { SubscriptionController } from './subscription.controller';
import { SubscriptionService } from './subscription.service';

@Module({
  imports: [
    AuthenticationModule,
    MongooseModule.forFeature([
      { name: Subscription.name, schema: SubscriptionSchema },
      { name: Gym.name, schema: GymSchema },
    ]),
    TransactionModule,
  ],
  controllers: [SubscriptionController],
  providers: [SubscriptionService],
})
export class SubscriptionModule {}
