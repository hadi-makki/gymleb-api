import { Injectable } from '@nestjs/common';
import { CreateManagerNotificationSettingDto } from './dto/create-manager-notification-setting.dto';
import { UpdateManagerNotificationSettingDto } from './dto/update-manager-notification-setting.dto';

@Injectable()
export class ManagerNotificationSettingsService {
  create(createManagerNotificationSettingDto: CreateManagerNotificationSettingDto) {
    return 'This action adds a new managerNotificationSetting';
  }

  findAll() {
    return `This action returns all managerNotificationSettings`;
  }

  findOne(id: number) {
    return `This action returns a #${id} managerNotificationSetting`;
  }

  update(id: number, updateManagerNotificationSettingDto: UpdateManagerNotificationSettingDto) {
    return `This action updates a #${id} managerNotificationSetting`;
  }

  remove(id: number) {
    return `This action removes a #${id} managerNotificationSetting`;
  }
}
