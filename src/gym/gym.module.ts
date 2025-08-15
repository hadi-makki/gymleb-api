import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Gym, GymSchema } from './entities/gym.entity';
import { GymController } from './gym.controller';
import { GymService } from './gym.service';
import { Manager, ManagerSchema } from '../manager/manager.entity';
import { AuthenticationModule } from '../common/AuthModule.module';
import {
  SubscriptionInstance,
  SubscriptionInstanceSchema,
} from '../transactions/subscription-instance.entity';
import { Member, MemberSchema } from '../member/entities/member.entity';
import { Expense, ExpenseSchema } from '../expenses/expense.entity';
import { Revenue, RevenueSchema } from '../revenue/revenue.entity';
import {
  OwnerSubscription,
  OwnerSubscriptionSchema,
} from 'src/owner-subscriptions/owner-subscription.entity';
@Module({
  imports: [
    AuthenticationModule,
    MongooseModule.forFeature([
      { name: Gym.name, schema: GymSchema },
      { name: Manager.name, schema: ManagerSchema },
      { name: SubscriptionInstance.name, schema: SubscriptionInstanceSchema },
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
