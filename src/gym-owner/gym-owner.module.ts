import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExpenseEntity } from 'src/expenses/expense.entity';
import { ExpensesService } from 'src/expenses/expenses.service';
import { GymEntity } from 'src/gym/entities/gym.entity';
import { MemberEntity } from 'src/member/entities/member.entity';
import { PTSessionEntity } from 'src/personal-trainers/entities/pt-sessions.entity';
import { PersonalTrainersService } from 'src/personal-trainers/personal-trainers.service';
import { ProductEntity } from 'src/products/products.entity';
import { RevenueEntity } from 'src/revenue/revenue.entity';
import { RevenueService } from 'src/revenue/revenue.service';
import { SubscriptionEntity } from 'src/subscription/entities/subscription.entity';
import { TwilioService } from 'src/twilio/twilio.service';
import { AuthenticationModule } from '../common/AuthModule.module';
import { MediaModule } from '../media/media.module';
import { MemberService } from '../member/member.service';
import { SubscriptionService } from '../subscription/subscription.service';
import { TransactionModule } from '../transactions/transaction.module';
import { GymOwnerController } from './gym-owner.controller';
import { GymOwnerService } from './gym-owner.service';
import { MemberAttendingDaysEntity } from 'src/member/entities/member-attending-days.entity';
import { MemberReservationEntity } from 'src/member/entities/member-reservation.entity';
import { ProductsOffersEntity } from 'src/products/products-offers.entity';
import { TwilioMessageEntity } from 'src/twilio/entities/twilio-message.entity';
import { NotificationSettingEntity } from 'src/notification-settings/entities/notification-setting.entity';
@Module({
  imports: [
    TypeOrmModule.forFeature([
      GymEntity,
      MemberEntity,
      ExpenseEntity,
      RevenueEntity,
      SubscriptionEntity,
      PTSessionEntity,
      ProductEntity,
      MemberAttendingDaysEntity,
      MemberReservationEntity,
      ProductsOffersEntity,
      TwilioMessageEntity,
      NotificationSettingEntity,
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
