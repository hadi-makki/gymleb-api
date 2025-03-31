import { Module } from '@nestjs/common';
import { TokenService } from './token.service';
import { TokenController } from './token.controller';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { User, UserSchema } from 'src/user/user.entity';
import { Manager, ManagerSchema } from 'src/manager/manager.entity';
import { MongooseModule } from '@nestjs/mongoose';
import Token, { TokenSchema } from './token.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Token.name, schema: TokenSchema },
      { name: User.name, schema: UserSchema },
      { name: Manager.name, schema: ManagerSchema },
    ]),
  ],
  providers: [JwtService, TokenService, ConfigService],
  controllers: [TokenController],
})
export class TokenModule {}
