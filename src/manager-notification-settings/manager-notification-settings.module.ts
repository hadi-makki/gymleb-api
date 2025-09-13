import { Module } from '@nestjs/common';
import { ManagerNotificationSettingsService } from './manager-notification-settings.service';
import { ManagerNotificationSettingsController } from './manager-notification-settings.controller';

@Module({
  controllers: [ManagerNotificationSettingsController],
  providers: [ManagerNotificationSettingsService],
})
export class ManagerNotificationSettingsModule {}
