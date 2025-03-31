import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { User, UserSchema } from 'src/user/user.entity';
import { TokenService } from 'src/token/token.service';
import { UserService } from 'src/user/user.service';
import Token, { TokenSchema } from 'src/token/token.entity';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Manager, ManagerSchema } from 'src/manager/manager.entity';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Token.name, schema: TokenSchema },
      { name: Manager.name, schema: ManagerSchema },
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
