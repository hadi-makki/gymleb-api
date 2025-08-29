import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthenticationModule } from '../common/AuthModule.module';
import { GymOwnerController } from './gym-owner.controller';
import { GymOwnerService } from './gym-owner.service';
import { Gym, GymSchema } from '../gym/entities/gym.model';
import { Member, MemberSchema } from '../member/entities/member.model';
import { Expense, ExpenseSchema } from '../expenses/expense.model';
import { Revenue, RevenueSchema } from '../revenue/revenue.model';
import {
  Subscription,
  SubscriptionSchema,
} from '../subscription/entities/subscription.model';
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
} from 'src/personal-trainers/entities/pt-sessions.model';
import { PTSessionEntity } from 'src/personal-trainers/entities/pt-sessions.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GymEntity } from 'src/gym/entities/gym.entity';
import { MemberEntity } from 'src/member/entities/member.entity';
import { ExpenseEntity } from 'src/expenses/expense.entity';
import { RevenueEntity } from 'src/revenue/revenue.entity';
import { SubscriptionEntity } from 'src/subscription/entities/subscription.entity';
import { ProductEntity } from 'src/products/products.entity';
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
    TypeOrmModule.forFeature([
      GymEntity,
      MemberEntity,
      ExpenseEntity,
      RevenueEntity,
      SubscriptionEntity,
      PTSessionEntity,
      ProductEntity,
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
