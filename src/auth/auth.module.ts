import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ManagerEntity } from 'src/manager/manager.entity';
import { MemberEntity } from 'src/member/entities/member.entity';
import { TokenEntity } from 'src/token/token.entity';
import { UserEntity } from 'src/user/user.entity';
import { TokenService } from '../token/token.service';
import { UserService } from '../user/user.service';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { GymEntity } from 'src/gym/entities/gym.entity';
import { AuthenticationModule } from 'src/common/AuthModule.module';
@Module({
  imports: [
    TypeOrmModule.forFeature([
      TokenEntity,
      UserEntity,
      ManagerEntity,
      MemberEntity,
      GymEntity,
    ]),
    AuthenticationModule,
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
