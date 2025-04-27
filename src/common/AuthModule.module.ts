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
import { ManagerController } from '../manager/manager.controller';
import { Member, MemberSchema } from '../member/entities/member.entity';
import {
  GymOwner,
  GymOwnerSchema,
} from '../gym-owner/entities/gym-owner.entity';
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Manager.name, schema: ManagerSchema },
      { name: Token.name, schema: TokenSchema },
      { name: User.name, schema: UserSchema },
      { name: Member.name, schema: MemberSchema },
      { name: GymOwner.name, schema: GymOwnerSchema },
    ]),
  ],
  providers: [
    ManagerService,
    TokenService,
    JwtService,
    ConfigService,
    AuthService,
    UserService,
  ],
  exports: [
    ManagerService,
    JwtService,
    ConfigService,
    AuthService,
    UserService,
    MongooseModule,
    TokenService,
  ],
})
export class AuthenticationModule {}
