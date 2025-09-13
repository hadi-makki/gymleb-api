import { OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { NotificationSettingEntity } from 'src/notification-settings/entities/notification-setting.entity';
import { Repository } from 'typeorm';
import { MemberEntity } from '../entities/member.entity';

export class MemberNotSettingsSeed implements OnModuleInit {
  constructor(
    @InjectRepository(NotificationSettingEntity)
    private readonly notificationSettingRepository: Repository<NotificationSettingEntity>,
    @InjectRepository(MemberEntity)
    private readonly memberRepository: Repository<MemberEntity>,
  ) {}

  async onModuleInit() {
    // await this.seedNotificationSettings();
  }

  async seedNotificationSettings() {
    const getMembers = await this.memberRepository.find({
      relations: {
        notificationSetting: true,
      },
    });

    console.log(getMembers);

    for (const member of getMembers) {
      if (!member.notificationSetting) {
        const createdNotificationSetting =
          this.notificationSettingRepository.create({
            welcomeMessage: true,
            monthlyReminder: true,
          });

        const notificationSetting =
          await this.notificationSettingRepository.save(
            createdNotificationSetting,
          );
        member.notificationSetting = notificationSetting;

        await this.memberRepository.save(member);
      }
    }
  }
}
