import { Module } from '@nestjs/common';

import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthenticationModule } from '../common/AuthModule.module';
import { TransactionModule } from '../transactions/subscription-instance.module';
import { AuthService } from '../auth/auth.service';
import { Member, MemberSchema } from '../member/entities/member.model';
import {
  OwnerSubscription,
  OwnerSubscriptionSchema,
} from '../owner-subscriptions/owner-subscription.model';
import Token, { TokenSchema } from '../token/token.model';
import { TokenService } from '../token/token.service';
import { User, UserSchema } from '../user/user.model';
import { UserService } from '../user/user.service';
import { ManagerController } from './manager.controller';
import { Manager, ManagerSchema } from './manager.model';
import { ManagerService } from './manager.service';
import { ManagerScript } from './managers.script';
import { ManagerEntity } from './manager.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Manager.name, schema: ManagerSchema },
      { name: Token.name, schema: TokenSchema },
      { name: User.name, schema: UserSchema },
      { name: Member.name, schema: MemberSchema },
      { name: OwnerSubscription.name, schema: OwnerSubscriptionSchema },
    ]),
    TypeOrmModule.forFeature([ManagerEntity]),
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
    ManagerScript,
  ],
  controllers: [ManagerController],
  exports: [ManagerService, ManagerModule, TypeOrmModule],
})
export class ManagerModule {}
