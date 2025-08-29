import { Module } from '@nestjs/common';
import { TokenService } from './token.service';
import { TokenController } from './token.controller';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { User, UserSchema } from '../user/user.model';
import { Manager, ManagerSchema } from '../manager/manager.model';
import { MongooseModule } from '@nestjs/mongoose';
import Token, { TokenSchema } from './token.model';
import { Member, MemberSchema } from '../member/entities/member.model';
import { MemberEntity } from 'src/member/entities/member.entity';
import { ManagerEntity } from 'src/manager/manager.entity';
import { UserEntity } from 'src/user/user.entity';
import { TokenEntity } from './token.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Token.name, schema: TokenSchema },
      { name: User.name, schema: UserSchema },
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
  providers: [JwtService, TokenService, ConfigService],
  controllers: [TokenController],
})
export class TokenModule {}
