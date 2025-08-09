import { Module } from '@nestjs/common';

import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import Token, { TokenSchema } from '../token/token.entity';
import { TokenService } from '../token/token.service';
import { User, UserSchema } from '../user/user.entity';
import { AuthService } from '../auth/auth.service';
import { UserService } from '../user/user.service';
import { ManagerService } from '../manager/manager.service';
import { Manager, ManagerSchema } from '../manager/manager.entity';
import { Member, MemberSchema } from '../member/entities/member.entity';
import { GymService } from 'src/gym/gym.service';
import { Gym, GymSchema } from 'src/gym/entities/gym.entity';
import {
  SubscriptionInstance,
  SubscriptionInstanceSchema,
} from 'src/transactions/subscription-instance.entity';
import { Expense, ExpenseSchema } from 'src/expenses/expense.entity';
import {
  OwnerSubscription,
  OwnerSubscriptionSchema,
} from 'src/owner-subscriptions/owner-subscription.entity';
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Manager.name, schema: ManagerSchema },
      { name: Token.name, schema: TokenSchema },
      { name: User.name, schema: UserSchema },
      { name: Member.name, schema: MemberSchema },
      { name: Gym.name, schema: GymSchema },
      { name: SubscriptionInstance.name, schema: SubscriptionInstanceSchema },
      { name: Expense.name, schema: ExpenseSchema },
      { name: OwnerSubscription.name, schema: OwnerSubscriptionSchema },
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
  ],
})
export class AuthenticationModule {}
