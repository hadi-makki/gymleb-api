import { Module } from '@nestjs/common';

import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import Token, { TokenSchema } from 'src/token/token.entity';
import { TokenService } from 'src/token/token.service';
import { User, UserSchema } from 'src/user/user.entity';
import { ManagerController } from './manager.controller';
import { Manager, ManagerSchema } from './manager.entity';
import { ManagerService } from './manager.service';
import { AuthService } from 'src/auth/auth.service';
import { UserService } from 'src/user/user.service';
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Manager.name, schema: ManagerSchema },
      { name: Token.name, schema: TokenSchema },
      { name: User.name, schema: UserSchema },
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
  controllers: [ManagerController],
})
export class ManagerModule {}
