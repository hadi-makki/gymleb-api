import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthenticationModule } from '../common/AuthModule.module';
import { GymOwnerController } from './gym-owner.controller';
import { GymOwnerService } from './gym-owner.service';
import { Gym, GymSchema } from '../gym/entities/gym.entity';
import { Member, MemberSchema } from '../member/entities/member.entity';
import { Expense, ExpenseSchema } from '../expenses/expense.entity';
import { Revenue, RevenueSchema } from '../revenue/revenue.entity';
import {
  Subscription,
  SubscriptionSchema,
} from '../subscription/entities/subscription.entity';
import { TransactionModule } from '../transactions/subscription-instance.module';
import { SubscriptionService } from '../subscription/subscription.service';
import { MemberService } from '../member/member.service';
import { MediaModule } from '../media/media.module';
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Gym.name, schema: GymSchema },
      { name: Member.name, schema: MemberSchema },
      { name: Expense.name, schema: ExpenseSchema },
      { name: Revenue.name, schema: RevenueSchema },
      { name: Subscription.name, schema: SubscriptionSchema },
    ]),
    AuthenticationModule,
    TransactionModule,
    MediaModule,
  ],
  controllers: [GymOwnerController],
  providers: [GymOwnerService, SubscriptionService, MemberService],
})
export class GymOwnerModule {}
