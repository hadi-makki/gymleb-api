import { Module } from '@nestjs/common';
import { TokenService } from './token.service';
import { TokenController } from './token.controller';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { User, UserSchema } from '../user/user.entity';
import { Manager, ManagerSchema } from '../manager/manager.entity';
import { MongooseModule } from '@nestjs/mongoose';
import Token, { TokenSchema } from './token.entity';
import { Member, MemberSchema } from '../member/entities/member.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Token.name, schema: TokenSchema },
      { name: User.name, schema: UserSchema },
      { name: Manager.name, schema: ManagerSchema },
      { name: Member.name, schema: MemberSchema },
    ]),
  ],
  providers: [JwtService, TokenService, ConfigService],
  controllers: [TokenController],
})
export class TokenModule {}
