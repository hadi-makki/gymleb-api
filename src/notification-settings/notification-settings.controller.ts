import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { NotificationSettingsService } from './notification-settings.service';
import { CreateNotificationSettingDto } from './dto/create-notification-setting.dto';
import { UpdateNotificationSettingDto } from './dto/update-notification-setting.dto';
import { ManagerAuthGuard } from 'src/guards/manager-auth.guard';
import { Roles } from 'src/decorators/roles/Role';
import { Permissions } from 'src/decorators/roles/role.enum';
import { ValidateGymRelatedToOwner } from 'src/decorators/validate-gym-related-to-owner.decorator';
import { ValidateMemberRelatedToGym } from 'src/decorators/validate-member-related-to-gym.decorator';

@Controller('notification-settings')
export class NotificationSettingsController {
  constructor(
    private readonly notificationSettingsService: NotificationSettingsService,
  ) {}

  @Patch('/:gymId/:memberId')
  @UseGuards(ManagerAuthGuard)
  @Roles(Permissions.GymOwner, Permissions.update_members)
  @ValidateGymRelatedToOwner()
  @ValidateMemberRelatedToGym()
  async update(
    @Body() createNotificationSettingDto: UpdateNotificationSettingDto,
    @Param('memberId') memberId: string,
  ) {
    return await this.notificationSettingsService.updateUserNotificationSettings(
      createNotificationSettingDto,
      memberId,
    );
  }
}
