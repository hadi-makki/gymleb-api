import { Module } from '@nestjs/common';

import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthenticationModule } from '../common/AuthModule.module';
import { TransactionModule } from '../transactions/subscription-instance.module';
import { AuthService } from '../auth/auth.service';
import { Member, MemberSchema } from '../member/entities/member.entity';
import {
  OwnerSubscription,
  OwnerSubscriptionSchema,
} from '../owner-subscriptions/owner-subscription.entity';
import Token, { TokenSchema } from '../token/token.entity';
import { TokenService } from '../token/token.service';
import { User, UserSchema } from '../user/user.entity';
import { UserService } from '../user/user.service';
import { ManagerController } from './manager.controller';
import { Manager, ManagerSchema } from './manager.entity';
import { ManagerService } from './manager.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Manager.name, schema: ManagerSchema },
      { name: Token.name, schema: TokenSchema },
      { name: User.name, schema: UserSchema },
      { name: Member.name, schema: MemberSchema },
      { name: OwnerSubscription.name, schema: OwnerSubscriptionSchema },
    ]),
    TransactionModule,
    AuthenticationModule,
  ],
  providers: [
    ManagerService,
    TokenService,
    JwtService,
    ConfigService,
    AuthService,
    UserService,
  ],
  controllers: [ManagerController],
})
export class ManagerModule {}
