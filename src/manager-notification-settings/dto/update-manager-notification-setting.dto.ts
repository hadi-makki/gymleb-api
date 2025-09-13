import { PartialType } from '@nestjs/swagger';
import { CreateManagerNotificationSettingDto } from './create-manager-notification-setting.dto';

export class UpdateManagerNotificationSettingDto extends PartialType(CreateManagerNotificationSettingDto) {}
