import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TransactionModule } from '../transactions/subscription-instance.module';
import { AuthenticationModule } from '../common/AuthModule.module';
import { Gym, GymSchema } from '../gym/entities/gym.model';
import {
  Subscription,
  SubscriptionSchema,
} from './entities/subscription.model';
import { SubscriptionController } from './subscription.controller';
import { SubscriptionService } from './subscription.service';
import { GymEntity } from 'src/gym/entities/gym.entity';
import { SubscriptionEntity } from './entities/subscription.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    AuthenticationModule,
    MongooseModule.forFeature([
      { name: Subscription.name, schema: SubscriptionSchema },
      { name: Gym.name, schema: GymSchema },
    ]),
    TypeOrmModule.forFeature([SubscriptionEntity, GymEntity]),
    TransactionModule,
  ],
  controllers: [SubscriptionController],
  providers: [SubscriptionService],
})
export class SubscriptionModule {}
