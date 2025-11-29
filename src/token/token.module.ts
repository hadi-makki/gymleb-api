import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ManagerEntity } from 'src/manager/manager.entity';
import { MemberEntity } from 'src/member/entities/member.entity';
import { UserEntity } from 'src/user/user.entity';
import { TokenController } from './token.controller';
import { TokenEntity } from './token.entity';
import { TokenService } from './token.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TokenEntity,
      UserEntity,
      ManagerEntity,
      MemberEntity,
    ]),
  ],
  providers: [JwtService, TokenService, ConfigService],
  controllers: [TokenController],
  exports: [TokenService],
})
export class TokenModule {}
