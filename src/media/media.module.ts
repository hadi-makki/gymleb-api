import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { S3Service } from '../s3/s3.service';
import Token, { TokenSchema } from '../token/token.entity';
import { User, UserSchema } from '../user/user.entity';
import { UserService } from '../user/user.service';
import { MediaController } from './media.controller';
import { Media, MediaSchema } from './media.entity';
import { MediaService } from './media.service';
import { AuthenticationModule } from 'src/common/AuthModule.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Media.name, schema: MediaSchema },
      { name: User.name, schema: UserSchema },
      { name: Token.name, schema: TokenSchema },
    ]),
    AuthenticationModule,
  ],
  controllers: [MediaController],
  providers: [MediaService, S3Service, ConfigService, UserService],
  exports: [MediaService, MongooseModule],
})
export class MediaModule {}
