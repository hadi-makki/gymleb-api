import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FirebaseService } from './firebase.service';
import { FirebaseController } from './firebase.controller';
import { AuthenticationModule } from 'src/common/AuthModule.module';
import { InAppNotificationEntity } from '../notifications/entities/in-app-notification.entity';
import { MemberEntity } from '../member/entities/member.entity';

@Module({
  imports: [
    ConfigModule,
    AuthenticationModule,
    TypeOrmModule.forFeature([InAppNotificationEntity, MemberEntity]),
  ],
  providers: [FirebaseService],
  controllers: [FirebaseController],
  exports: [FirebaseService],
})
export class FirebaseModule {}
