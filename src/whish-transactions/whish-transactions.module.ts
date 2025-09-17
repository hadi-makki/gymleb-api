import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WhishTransaction } from './entities/whish-transaction.entity';
import { WhishTransactionsController } from './whish-transactions.controller';
import { WhishTransactionsService } from './whish-transactions.service';
import { OwnerSubscriptionsModule } from '../owner-subscriptions/owner-subscriptions.module';
import { OwnerSubscriptionTypeEntity } from '../owner-subscriptions/owner-subscription-type.entity';
import { ManagerEntity } from '../manager/manager.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      WhishTransaction,
      OwnerSubscriptionTypeEntity,
      ManagerEntity,
    ]),
    ConfigModule, // to access env
    forwardRef(() => OwnerSubscriptionsModule),
  ],
  controllers: [WhishTransactionsController],
  providers: [WhishTransactionsService],
})
export class WhishTransactionsModule {}
