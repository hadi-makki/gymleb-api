import { Module } from '@nestjs/common';
import { NotificationSettingsService } from './notification-settings.service';
import { NotificationSettingsController } from './notification-settings.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationSettingEntity } from './entities/notification-setting.entity';
import { MemberEntity } from 'src/member/entities/member.entity';
import { AuthenticationModule } from 'src/common/AuthModule.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([NotificationSettingEntity, MemberEntity]),
    AuthenticationModule,
  ],
  controllers: [NotificationSettingsController],
  providers: [NotificationSettingsService],
  exports: [NotificationSettingsService, TypeOrmModule],
})
export class NotificationSettingsModule {}
