import { Module } from '@nestjs/common';
import { OwnerSubscriptionsController } from './owner-subscriptions.controller';
import { OwnerSubscriptionsService } from './owner-subscriptions.service';

import { TypeOrmModule } from '@nestjs/typeorm';
import { ManagerEntity } from 'src/manager/manager.entity';
import { AuthenticationModule } from '../common/AuthModule.module';
import { TransactionModule } from '../transactions/subscription-instance.module';
import { OwnerSubscriptionTypeEntity } from './owner-subscription-type.entity';

@Module({
  imports: [
    AuthenticationModule,
    TransactionModule,

    TypeOrmModule.forFeature([OwnerSubscriptionTypeEntity, ManagerEntity]),
  ],
  controllers: [OwnerSubscriptionsController],
  providers: [OwnerSubscriptionsService],
  exports: [OwnerSubscriptionsService, TypeOrmModule],
})
export class OwnerSubscriptionsModule {}
