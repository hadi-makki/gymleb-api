import { Module } from '@nestjs/common';

import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthService } from '../auth/auth.service';
import { AuthenticationModule } from '../common/AuthModule.module';
import { TokenService } from '../token/token.service';
import { TransactionModule } from '../transactions/transaction.module';
import { UserService } from '../user/user.service';
import { UserModule } from '../user/user.module';
import { ManagerController } from './manager.controller';
import { ManagerEntity } from './manager.entity';
import { ManagerService } from './manager.service';
import { ManagerScript } from './managers.script';

@Module({
  imports: [
    TypeOrmModule.forFeature([ManagerEntity]),
    TransactionModule,
    AuthenticationModule,
    UserModule,
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
