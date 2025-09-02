import { Module } from '@nestjs/common';

import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExpenseEntity } from 'src/expenses/expense.entity';
import { GymEntity } from 'src/gym/entities/gym.entity';
import { ManagerEntity } from 'src/manager/manager.entity';
import { MemberEntity } from 'src/member/entities/member.entity';
import { TokenEntity } from 'src/token/token.entity';
import { TransactionEntity } from 'src/transactions/transaction.entity';
import { AuthService } from '../auth/auth.service';
import { GymService } from '../gym/gym.service';
import { ManagerService } from '../manager/manager.service';
import { TokenService } from '../token/token.service';
import { UserService } from '../user/user.service';
import { UserEntity } from 'src/user/user.entity';
@Module({
  imports: [
    TypeOrmModule.forFeature([
      TokenEntity,
      MemberEntity,
      TransactionEntity,
      GymEntity,
      ManagerEntity,
      ExpenseEntity,
      UserEntity,
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
    TokenService,
    GymService,
    TypeOrmModule,
  ],
})
export class AuthenticationModule {}
