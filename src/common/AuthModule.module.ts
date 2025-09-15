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
import { TransactionService } from 'src/transactions/subscription-instance.service';
import { ProductEntity } from 'src/products/products.entity';
import { SubscriptionEntity } from 'src/subscription/entities/subscription.entity';
import { OwnerSubscriptionTypeEntity } from 'src/owner-subscriptions/owner-subscription-type.entity';
import { RevenueEntity } from 'src/revenue/revenue.entity';
import { PTSessionEntity } from 'src/personal-trainers/entities/pt-sessions.entity';
import { MediaService } from 'src/media/media.service';
import { MediaEntity } from 'src/media/media.entity';
import { S3Service } from 'src/s3/s3.service';
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
      ProductEntity,
      SubscriptionEntity,
      OwnerSubscriptionTypeEntity,
      RevenueEntity,
      PTSessionEntity,
      MediaEntity,
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
    TransactionService,
    MediaService,
    S3Service,
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
    TransactionService,
    MediaService,
  ],
})
export class AuthenticationModule {}
