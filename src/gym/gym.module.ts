import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Gym, GymSchema } from './entities/gym.model';
import { GymController } from './gym.controller';
import { GymService } from './gym.service';
import { Manager, ManagerSchema } from '../manager/manager.model';
import { AuthenticationModule } from '../common/AuthModule.module';

import { Member, MemberSchema } from '../member/entities/member.model';
import { Expense, ExpenseSchema } from '../expenses/expense.model';
import { Revenue, RevenueSchema } from '../revenue/revenue.model';
import {
  OwnerSubscription,
  OwnerSubscriptionSchema,
} from '../owner-subscriptions/owner-subscription.model';
import {
  Transaction,
  TransactionSchema,
} from '../transactions/transaction.model';
@Module({
  imports: [
    AuthenticationModule,
    MongooseModule.forFeature([
      { name: Gym.name, schema: GymSchema },
      { name: Manager.name, schema: ManagerSchema },
      { name: Transaction.name, schema: TransactionSchema },
      { name: Member.name, schema: MemberSchema },
      { name: Expense.name, schema: ExpenseSchema },
      { name: Revenue.name, schema: RevenueSchema },
      { name: OwnerSubscription.name, schema: OwnerSubscriptionSchema },
    ]),
  ],
  controllers: [GymController],
  providers: [GymService],
  exports: [GymService, MongooseModule],
})
export class GymModule {}
