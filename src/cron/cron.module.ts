import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { MongooseModule } from '@nestjs/mongoose';
import { CronService } from './cron.service';
import { CronController } from './cron.controller';
import { Member, MemberSchema } from '../member/entities/member.entity';
import {
  Transaction,
  TransactionSchema,
} from '../transactions/transaction.entity';
import { Gym, GymSchema } from '../gym/entities/gym.model';
import { TwilioModule } from '../twilio/twilio.module';
import { MemberModule } from '../member/member.module';
import { Manager, ManagerSchema } from 'src/manager/manager.model';
import { AuthenticationModule } from 'src/common/AuthModule.module';
import { MemberService } from 'src/member/member.service';
import { SubscriptionModule } from 'src/subscription/subscription.module';
import {
  Subscription,
  SubscriptionSchema,
} from 'src/subscription/entities/subscription.entity';
import { TransactionService } from 'src/transactions/subscription-instance.service';
import { MediaModule } from 'src/media/media.module';
import { PersonalTrainersModule } from 'src/personal-trainers/personal-trainers.module';
import { Product, ProductSchema } from 'src/products/products.entity';
import { ProductsModule } from 'src/products/products.module';
import { OwnerSubscriptionsModule } from 'src/owner-subscriptions/owner-subscriptions.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    MongooseModule.forFeature([
      { name: Member.name, schema: MemberSchema },
      { name: Transaction.name, schema: TransactionSchema },
      { name: Gym.name, schema: GymSchema },
      { name: Manager.name, schema: ManagerSchema },
      { name: Subscription.name, schema: SubscriptionSchema },
      { name: Product.name, schema: ProductSchema },
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
