import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { S3Service } from '../s3/s3.service';
import Token, { TokenSchema } from '../token/token.model';
import { User, UserSchema } from '../user/user.model';
import { UserService } from '../user/user.service';
import { MediaController } from './media.controller';
import { Media, MediaSchema } from './media.model';
import { MediaService } from './media.service';
import { AuthenticationModule } from '../common/AuthModule.module';
import { MediaEntity } from './media.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TokenEntity } from 'src/token/token.entity';
import { UserEntity } from 'src/user/user.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Media.name, schema: MediaSchema },
      { name: User.name, schema: UserSchema },
      { name: Token.name, schema: TokenSchema },
    ]),
    TypeOrmModule.forFeature([MediaEntity, UserEntity, TokenEntity]),
    AuthenticationModule,
  ],
  controllers: [MediaController],
  providers: [MediaService, S3Service, ConfigService, UserService],
  exports: [MediaService, MongooseModule],
})
export class MediaModule {}
