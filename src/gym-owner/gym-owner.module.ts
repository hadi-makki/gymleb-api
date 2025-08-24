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
import { RevenueService } from 'src/revenue/revenue.service';
import { ExpensesService } from 'src/expenses/expenses.service';
import { TwilioService } from 'src/twilio/twilio.service';
import { PersonalTrainersService } from 'src/personal-trainers/personal-trainers.service';
import {
  PTSession,
  PTSessionSchema,
} from 'src/personal-trainers/entities/pt-sessions.entity';
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Gym.name, schema: GymSchema },
      { name: Member.name, schema: MemberSchema },
      { name: Expense.name, schema: ExpenseSchema },
      { name: Revenue.name, schema: RevenueSchema },
      { name: Subscription.name, schema: SubscriptionSchema },
      { name: PTSession.name, schema: PTSessionSchema },
    ]),
    AuthenticationModule,
    TransactionModule,
    MediaModule,
  ],
  controllers: [GymOwnerController],
  providers: [
    GymOwnerService,
    SubscriptionService,
    MemberService,
    ExpensesService,
    RevenueService,
    TwilioService,
    PersonalTrainersService,
  ],
})
export class GymOwnerModule {}
