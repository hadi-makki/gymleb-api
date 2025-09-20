import { Module } from '@nestjs/common';
import { TransactionController } from './transaction.controller';
import { TransactionService } from './transaction.service';

import { TypeOrmModule } from '@nestjs/typeorm';
import { ExpenseEntity } from 'src/expenses/expense.entity';
import { GymEntity } from 'src/gym/entities/gym.entity';
import { ManagerEntity } from 'src/manager/manager.entity';
import { MemberEntity } from 'src/member/entities/member.entity';
import { OwnerSubscriptionTypeEntity } from 'src/owner-subscriptions/owner-subscription-type.entity';
import { ProductEntity } from 'src/products/products.entity';
import { RevenueEntity } from 'src/revenue/revenue.entity';
import { SubscriptionEntity } from 'src/subscription/entities/subscription.entity';
import { UserEntity } from 'src/user/user.entity';
import { AuthenticationModule } from '../common/AuthModule.module';
import { TransactionEntity } from './transaction.entity';
import { PTSessionEntity } from 'src/personal-trainers/entities/pt-sessions.entity';
import { MigrateTransactions } from './migrate-transactions';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TransactionEntity,
      UserEntity,
      ProductEntity,
      MemberEntity,
      GymEntity,
      ManagerEntity,
      ExpenseEntity,
      SubscriptionEntity,
      OwnerSubscriptionTypeEntity,
      RevenueEntity,
      PTSessionEntity,
    ]),
    AuthenticationModule,
  ],
  providers: [TransactionService, MigrateTransactions],
  controllers: [TransactionController],
  exports: [TransactionService, TypeOrmModule],
})
export class TransactionModule {}
