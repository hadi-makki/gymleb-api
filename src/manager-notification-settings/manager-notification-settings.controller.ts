import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ManagerNotificationSettingsService } from './manager-notification-settings.service';
import { CreateManagerNotificationSettingDto } from './dto/create-manager-notification-setting.dto';
import { UpdateManagerNotificationSettingDto } from './dto/update-manager-notification-setting.dto';

@Controller('manager-notification-settings')
export class ManagerNotificationSettingsController {
  constructor(private readonly managerNotificationSettingsService: ManagerNotificationSettingsService) {}

  @Post()
  create(@Body() createManagerNotificationSettingDto: CreateManagerNotificationSettingDto) {
    return this.managerNotificationSettingsService.create(createManagerNotificationSettingDto);
  }

  @Get()
  findAll() {
    return this.managerNotificationSettingsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.managerNotificationSettingsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateManagerNotificationSettingDto: UpdateManagerNotificationSettingDto) {
    return this.managerNotificationSettingsService.update(+id, updateManagerNotificationSettingDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.managerNotificationSettingsService.remove(+id);
  }
}
