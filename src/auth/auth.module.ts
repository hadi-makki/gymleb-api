import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { User, UserSchema } from '../user/user.entity';
import { TokenService } from '../token/token.service';
import { UserService } from '../user/user.service';
import Token, { TokenSchema } from '../token/token.entity';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Manager, ManagerSchema } from '../manager/manager.entity';
import { MongooseModule } from '@nestjs/mongoose';
import { Member, MemberSchema } from '../member/entities/member.entity';
import { GymService } from 'src/gym/gym.service';
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Token.name, schema: TokenSchema },
      { name: Manager.name, schema: ManagerSchema },
      { name: Member.name, schema: MemberSchema },
    ]),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    UserService,
    JwtService,
    ConfigService,
    TokenService,
  ],
})
export class AuthModule {}
