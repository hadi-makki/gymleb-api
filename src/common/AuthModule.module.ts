import { Module } from '@nestjs/common';

import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import Token, { TokenSchema } from '../token/token.model';
import { TokenService } from '../token/token.service';
import { User, UserSchema } from '../user/user.model';
import { AuthService } from '../auth/auth.service';
import { UserService } from '../user/user.service';
import { ManagerService } from '../manager/manager.service';
import { Manager, ManagerSchema } from '../manager/manager.model';
import { Member, MemberSchema } from '../member/entities/member.model';
import { GymService } from '../gym/gym.service';
import { Gym, GymSchema } from '../gym/entities/gym.model';
import { Expense, ExpenseSchema } from '../expenses/expense.model';
import {
  OwnerSubscription,
  OwnerSubscriptionSchema,
} from '../owner-subscriptions/owner-subscription.model';
import { Revenue, RevenueSchema } from '../revenue/revenue.model';
import {
  Transaction,
  TransactionSchema,
} from '../transactions/transaction.model';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TokenEntity } from 'src/token/token.entity';
import { MemberEntity } from 'src/member/entities/member.entity';
import { TransactionEntity } from 'src/transactions/transaction.entity';
import { GymEntity } from 'src/gym/entities/gym.entity';
import { ManagerEntity } from 'src/manager/manager.entity';
import { OwnerSubscriptionEntity } from 'src/owner-subscriptions/owner-subscription.entity';
import { ExpenseEntity } from 'src/expenses/expense.entity';
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Manager.name, schema: ManagerSchema },
      { name: Token.name, schema: TokenSchema },
      { name: User.name, schema: UserSchema },
      { name: Member.name, schema: MemberSchema },
      { name: Gym.name, schema: GymSchema },
      { name: Transaction.name, schema: TransactionSchema },
      { name: Expense.name, schema: ExpenseSchema },
      { name: Revenue.name, schema: RevenueSchema },
      { name: OwnerSubscription.name, schema: OwnerSubscriptionSchema },
    ]),
    TypeOrmModule.forFeature([
      TokenEntity,
      MemberEntity,
      TransactionEntity,
      GymEntity,
      ManagerEntity,
      OwnerSubscriptionEntity,
      ExpenseEntity,
    ]),
  ],
  providers: [
    ManagerService,
    TokenService,
    JwtService,
    ConfigService,
    AuthService,
    UserService,
    GymService,
  ],
  exports: [
    ManagerService,
    JwtService,
    ConfigService,
    AuthService,
    UserService,
    MongooseModule,
    TokenService,
    GymService,
    TypeOrmModule,
  ],
})
export class AuthenticationModule {}
