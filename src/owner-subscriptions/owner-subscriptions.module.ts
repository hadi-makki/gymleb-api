import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  OwnerSubscriptionType,
  OwnerSubscriptionTypeSchema,
} from './owner-subscription-type.model';
import {
  OwnerSubscription,
  OwnerSubscriptionSchema,
} from './owner-subscription.model';
import { OwnerSubscriptionsController } from './owner-subscriptions.controller';
import { OwnerSubscriptionsService } from './owner-subscriptions.service';

import { AuthenticationModule } from '../common/AuthModule.module';
import { Manager, ManagerSchema } from '../manager/manager.model';
import { TransactionModule } from '../transactions/subscription-instance.module';

@Module({
  imports: [
    AuthenticationModule,
    TransactionModule,
    MongooseModule.forFeature([
      { name: OwnerSubscriptionType.name, schema: OwnerSubscriptionTypeSchema },
      { name: OwnerSubscription.name, schema: OwnerSubscriptionSchema },
      { name: Manager.name, schema: ManagerSchema },
    ]),
  ],
  controllers: [OwnerSubscriptionsController],
  providers: [OwnerSubscriptionsService],
  exports: [OwnerSubscriptionsService, MongooseModule],
})
export class OwnerSubscriptionsModule {}
