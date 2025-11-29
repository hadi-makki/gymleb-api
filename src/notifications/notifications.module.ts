import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { TokenEntity } from '../token/token.entity';
import { InAppNotificationEntity } from './entities/in-app-notification.entity';
import { MemberEntity } from '../member/entities/member.entity';
import { TokenModule } from '../token/token.module';
import { AuthenticationModule } from 'src/common/AuthModule.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TokenEntity,
      InAppNotificationEntity,
      MemberEntity,
    ]),
    TokenModule,
    AuthenticationModule,
  ],
  providers: [NotificationsService],
  controllers: [NotificationsController],
  exports: [NotificationsService],
})
export class NotificationsModule {}
