import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import Token, { TokenSchema } from 'src/token/token.entity';
import { UserController } from './user.controller';
import { User, UserSchema } from './user.entity';
import { UserService } from './user.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Token.name, schema: TokenSchema },
    ]),
  ],
  controllers: [UserController],
  providers: [UserService],
})
export class UserModule {}
