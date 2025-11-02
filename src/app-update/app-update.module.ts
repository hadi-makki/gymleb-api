import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppUpdateController } from './app-update.controller';
import { AppUpdateService } from './app-update.service';
import { AppVersionEntity } from './entities/app-version.entity';
import { S3Module } from '../s3/s3.module';
import { S3Service } from '../s3/s3.service';
import { ConfigService } from '@nestjs/config';
import { AuthenticationModule } from 'src/common/AuthModule.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([AppVersionEntity]),
    S3Module,
    AuthenticationModule,
  ],
  controllers: [AppUpdateController],
  providers: [AppUpdateService, S3Service, ConfigService],
  exports: [AppUpdateService],
})
export class AppUpdateModule {}
