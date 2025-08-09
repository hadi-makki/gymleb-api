import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  OwnerSubscriptionType,
  OwnerSubscriptionTypeSchema,
} from './owner-subscription-type.entity';
import {
  OwnerSubscription,
  OwnerSubscriptionSchema,
} from './owner-subscription.entity';
import { OwnerSubscriptionsController } from './owner-subscriptions.controller';
import { OwnerSubscriptionsService } from './owner-subscriptions.service';

import { AuthenticationModule } from '../common/AuthModule.module';
import { Manager, ManagerSchema } from '../manager/manager.entity';
import { SubscriptionInstanceModule } from '../transactions/subscription-instance.module';

@Module({
  imports: [
    AuthenticationModule,
    SubscriptionInstanceModule,
    MongooseModule.forFeature([
      { name: OwnerSubscriptionType.name, schema: OwnerSubscriptionTypeSchema },
      { name: OwnerSubscription.name, schema: OwnerSubscriptionSchema },
      { name: Manager.name, schema: ManagerSchema },
    ]),
  ],
  controllers: [OwnerSubscriptionsController],
  providers: [OwnerSubscriptionsService],
  exports: [OwnerSubscriptionsService],
})
export class OwnerSubscriptionsModule {}
