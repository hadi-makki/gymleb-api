import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthenticationModule } from 'src/common/AuthModule.module';
import { ExpenseEntity } from 'src/expenses/expense.entity';
import { GymEntity } from 'src/gym/entities/gym.entity';
import { ManagerEntity } from 'src/manager/manager.entity';
import { MediaModule } from 'src/media/media.module';
import { MemberEntity } from 'src/member/entities/member.entity';
import { MemberService } from 'src/member/member.service';
import { OwnerSubscriptionTypeEntity } from 'src/owner-subscriptions/owner-subscription-type.entity';
import { OwnerSubscriptionsModule } from 'src/owner-subscriptions/owner-subscriptions.module';
import { PersonalTrainersModule } from 'src/personal-trainers/personal-trainers.module';
import { ProductEntity } from 'src/products/products.entity';
import { ProductsModule } from 'src/products/products.module';
import { RevenueEntity } from 'src/revenue/revenue.entity';
import { SubscriptionEntity } from 'src/subscription/entities/subscription.entity';
import { TransactionService } from 'src/transactions/transaction.service';
import { TransactionEntity } from 'src/transactions/transaction.entity';
import { UserEntity } from 'src/user/user.entity';
import { MemberModule } from '../member/member.module';
import { TwilioModule } from '../twilio/twilio.module';
import { CronController } from './cron.controller';
import { CronService } from './cron.service';

@Module({
  imports: [
    ScheduleModule.forRoot(),

    TypeOrmModule.forFeature([
      MemberEntity,
      TransactionEntity,
      GymEntity,
      ManagerEntity,
      SubscriptionEntity,
      ProductEntity,
      UserEntity,
      OwnerSubscriptionTypeEntity,
      RevenueEntity,
      ExpenseEntity,
    ]),
    TwilioModule,
    MemberModule,
    AuthenticationModule,
    MediaModule,
    PersonalTrainersModule,
    ProductsModule,
    OwnerSubscriptionsModule,
  ],
  controllers: [CronController],
  providers: [CronService, MemberService, TransactionService],
  exports: [CronService],
})
export class CronModule {}
