import { Injectable } from '@nestjs/common';
import { CreateNotificationSettingDto } from './dto/create-notification-setting.dto';
import { UpdateNotificationSettingDto } from './dto/update-notification-setting.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { NotificationSettingEntity } from './entities/notification-setting.entity';
import { Repository } from 'typeorm';
import { MemberEntity } from 'src/member/entities/member.entity';
import { NotFoundException } from 'src/error/not-found-error';

@Injectable()
export class NotificationSettingsService {
  constructor(
    @InjectRepository(NotificationSettingEntity)
    private readonly notificationSettingRepository: Repository<NotificationSettingEntity>,
    @InjectRepository(MemberEntity)
    private readonly memberRepository: Repository<MemberEntity>,
  ) {}

  async updateUserNotificationSettings(
    createNotificationSettingDto: UpdateNotificationSettingDto,
    memberId: string,
  ) {
    const member = await this.memberRepository.findOne({
      where: { id: memberId },
      relations: {
        notificationSetting: true,
      },
    });

    if (!member) {
      throw new NotFoundException('Member not found');
    }

    if (!member.notificationSetting) {
      throw new NotFoundException('Notification setting not found');
    }

    member.notificationSetting.welcomeMessage =
      createNotificationSettingDto.welcomeMessage;
    member.notificationSetting.monthlyReminder =
      createNotificationSettingDto.monthlyReminder;

    return await this.notificationSettingRepository.save(
      member.notificationSetting,
    );
  }
}
