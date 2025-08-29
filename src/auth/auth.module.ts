import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { User, UserSchema } from '../user/user.model';
import { TokenService } from '../token/token.service';
import { UserService } from '../user/user.service';
import Token, { TokenSchema } from '../token/token.model';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Manager, ManagerSchema } from '../manager/manager.model';
import { MongooseModule } from '@nestjs/mongoose';
import { Member, MemberSchema } from '../member/entities/member.model';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TokenEntity } from 'src/token/token.entity';
import { MemberEntity } from 'src/member/entities/member.entity';
import { ManagerEntity } from 'src/manager/manager.entity';
import { UserEntity } from 'src/user/user.entity';
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Token.name, schema: TokenSchema },
      { name: Manager.name, schema: ManagerSchema },
      { name: Member.name, schema: MemberSchema },
    ]),
    TypeOrmModule.forFeature([
      TokenEntity,
      UserEntity,
      ManagerEntity,
      MemberEntity,
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
