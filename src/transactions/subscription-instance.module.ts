import { Module } from '@nestjs/common';
import { TransactionController } from './subscription-instance.controller';
import { TransactionService } from './subscription-instance.service';

import { TypeOrmModule } from '@nestjs/typeorm';
import { ExpenseEntity } from 'src/expenses/expense.entity';
import { GymEntity } from 'src/gym/entities/gym.entity';
import { ManagerEntity } from 'src/manager/manager.entity';
import { MemberEntity } from 'src/member/entities/member.entity';
import { OwnerSubscriptionTypeEntity } from 'src/owner-subscriptions/owner-subscription-type.entity';
import { OwnerSubscriptionEntity } from 'src/owner-subscriptions/owner-subscription.entity';
import { ProductEntity } from 'src/products/products.entity';
import { RevenueEntity } from 'src/revenue/revenue.entity';
import { SubscriptionEntity } from 'src/subscription/entities/subscription.entity';
import { UserEntity } from 'src/user/user.entity';
import { AuthenticationModule } from '../common/AuthModule.module';
import { SubscriptionInstanceEntity } from './subscription-instance.entity';
import { TransactionEntity } from './transaction.entity';
import { TransactionSeeding } from './transactions.seed';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TransactionEntity,
      UserEntity,
      ProductEntity,
      MemberEntity,
      GymEntity,
      ManagerEntity,
      OwnerSubscriptionEntity,
      ExpenseEntity,
      SubscriptionEntity,
      OwnerSubscriptionTypeEntity,
      RevenueEntity,
      SubscriptionInstanceEntity,
    ]),
    AuthenticationModule,
  ],
  providers: [TransactionService, TransactionSeeding],
  controllers: [TransactionController],
  exports: [TransactionService, TypeOrmModule],
})
export class TransactionModule {}
