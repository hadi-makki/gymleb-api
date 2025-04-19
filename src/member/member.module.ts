import { Module } from '@nestjs/common';
import { MemberService } from './member.service';
import { MemberController } from './member.controller';
import { Member, MemberSchema } from './entities/member.entity';
import { MongooseModule } from '@nestjs/mongoose';
import { Gym, GymSchema } from 'src/gym/entities/gym.entity';
import {
  Subscription,
  SubscriptionSchema,
} from 'src/subscription/entities/subscription.entity';
import { AuthenticationModule } from 'src/common/AuthModule.module';
import {
  Transaction,
  TransactionSchema,
} from 'src/transactions/transaction.entity';
import { TransactionsModule } from 'src/transactions/transactions.module';
@Module({
  imports: [
    AuthenticationModule,
    MongooseModule.forFeature([
      { name: Member.name, schema: MemberSchema },
      { name: Gym.name, schema: GymSchema },
      { name: Subscription.name, schema: SubscriptionSchema },
    ]),
    TransactionsModule,
  ],
  controllers: [MemberController],
  providers: [MemberService],
})
export class MemberModule {}
