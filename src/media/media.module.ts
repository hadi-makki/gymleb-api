import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TokenEntity } from 'src/token/token.entity';
import { UserEntity } from 'src/user/user.entity';
import { AuthenticationModule } from '../common/AuthModule.module';
import { S3Service } from '../s3/s3.service';
import { MediaController } from './media.controller';
import { MediaEntity } from './media.entity';
import { MediaService } from './media.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([MediaEntity, UserEntity, TokenEntity]),
    AuthenticationModule,
  ],
  controllers: [MediaController],
  providers: [MediaService, S3Service, ConfigService],
  exports: [MediaService, TypeOrmModule],
})
export class MediaModule {}
