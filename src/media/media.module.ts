import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { S3Service } from 'src/s3/s3.service';
import Token, { TokenSchema } from 'src/token/token.entity';
import { User, UserSchema } from 'src/user/user.entity';
import { UserService } from 'src/user/user.service';
import { MediaController } from './media.controller';
import { Media, MediaSchema } from './media.entity';
import { MediaService } from './media.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Media.name, schema: MediaSchema },
      { name: User.name, schema: UserSchema },
      { name: Token.name, schema: TokenSchema },
    ]),
  ],
  controllers: [MediaController],
  providers: [MediaService, S3Service, ConfigService, UserService],
})
export class MediaModule {}
