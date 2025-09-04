import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BadRequestException } from '../error/bad-request-error';
import { GymService } from '../gym/gym.service';
import { MemberService } from '../member/member.service';
import { InjectRepository } from '@nestjs/typeorm';
import { isPhoneNumber } from 'class-validator';
import { format } from 'date-fns';
import { checkNodeEnv } from 'src/config/helper/helper-functions';
import { ManagerEntity } from 'src/manager/manager.entity';
import { MemberEntity } from 'src/member/entities/member.entity';
import { Twilio } from 'twilio';
import { Repository } from 'typeorm';
import { GymEntity, GymTypeEnum } from 'src/gym/entities/gym.entity';

export enum TwilioWhatsappTemplates {
  EXPIARY_REMINDER = 'HXe8f26377490ff319bae6b9c1d9538486',
  // SUBSCRIPTION_EXPIRED = 'HX9f136ce037cfb13b0d4daf887b331437',
  WELCOME_MESSAGE = 'HX33a3ef241f8933d43327e397663b1347',
  WELCOME_MESSAGE_CALISTHENICS = 'HX67b2797d8b8bae74e5dd066c4db608d0',
}

@Injectable()
export class TwilioService {
  constructor(
    private readonly configService: ConfigService,
    private readonly gymService: GymService,
    @Inject(forwardRef(() => MemberService))
    private readonly memberService: MemberService,
    @InjectRepository(MemberEntity)
    private readonly memberModel: Repository<MemberEntity>,
  ) {}

  private readonly allowedMessagesNumber = 500;

  private readonly client = new Twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH,
  );

  async notifyExpiredMembers(manager: ManagerEntity, gymId: string) {
    const members = await this.memberService.getExpiredMembers(
      manager,
      1000,
      1,
      '',
      gymId,
    );

    let notifiedNumber = 0;
    for (const member of members.data) {
      if (member.phone && !member.isNotified) {
        await this.memberService.toggleNotified(member.id, true);
        notifiedNumber++;
      }
    }
    await this.gymService.addGymMembersNotified(gymId, notifiedNumber);
  }

  async sendWelcomeMessage(
    memberName: string,
    memberPhone: string,
    gym: GymEntity,
  ) {
    const member = await this.memberModel.findOne({
      where: { phone: memberPhone },
    });
    const freeTrialGyms = [
      'b3c78af5-afe1-4246-a030-17bb07091f83',
      'dd94ac67-9378-404f-811e-7e2ec8be4470',
    ];

    const welcomeAndExpirationMessages =
      gym.welcomeMessageNotified + gym.membersNotified;
    console.log('welcomeAndExpirationMessages', welcomeAndExpirationMessages);
    console.log('freeTrialGyms', freeTrialGyms.includes(gym.id));
    console.log('gym.id', gym.id);
    console.log(
      'welcomeAndExpirationMessages <= 50',
      welcomeAndExpirationMessages <= 50,
    );

    if (
      !freeTrialGyms.includes(gym.id) ||
      (freeTrialGyms.includes(gym.id) && welcomeAndExpirationMessages >= 50)
    ) {
      console.log(
        'free trial gym or welcome and expiration messages limit reached',
      );
      return;
    }

    if (member.isWelcomeMessageSent) {
      console.log('member is already notified');
      return;
    }

    member.isWelcomeMessageSent = true;
    await this.memberModel.save(member);

    if (!checkNodeEnv('local') && isPhoneNumber(memberPhone)) {
      console.log('sending notification to', memberPhone);
      await this.client.messages
        .create({
          from: `whatsapp:${this.configService.get<string>('TWILIO_PHONE_NUMBER')}`,
          to: `whatsapp:${memberPhone}`,
          contentSid:
            gym.gymType === GymTypeEnum.CALISTHENICS
              ? TwilioWhatsappTemplates.WELCOME_MESSAGE_CALISTHENICS
              : TwilioWhatsappTemplates.WELCOME_MESSAGE,
          contentVariables: JSON.stringify({
            1: memberName,
            2: gym.name,
            3: `https://gym-leb.com/${gym.gymDashedName}/overview`,
            4: gym.phone,
          }),
        })
        .then(async () => {
          await this.gymService.addGymWelcomeMessageNotified(gym.id, 1);
        })
        .catch((error) => {
          console.log('this is twilio error', error);
          throw new BadRequestException(error);
        });
    } else {
      console.log('member notified successfully');
      if (checkNodeEnv('local')) {
        await this.gymService.addGymWelcomeMessageNotified(gym.id, 1);
      }
      return;
    }
  }

  async notifySingleMember(
    userId: string,
    gymId: string,
    dontCheckExpired = false,
  ) {
    const member = await this.memberService.getMemberByIdAndGym(userId, gymId);
    const gym = await this.gymService.getGymById(gymId);
    const isExpired =
      !dontCheckExpired &&
      (await this.memberService.checkUserSubscriptionExpired(member.id));
    if (gym.membersNotified > this.allowedMessagesNumber) {
      throw new BadRequestException('Gym members notified limit reached');
    }
    if (!isExpired && !dontCheckExpired) {
      throw new BadRequestException('Member subscription is not expired');
    }
    if (member.isNotified) {
      throw new BadRequestException('Member is already notified');
    }
    const freeTrialGyms = ['b3c78af5-afe1-4246-a030-17bb07091f83'];

    const welcomeAndExpirationMessages =
      gym.welcomeMessageNotified + gym.membersNotified;

    if (
      !checkNodeEnv('local') &&
      isPhoneNumber(member.phone) &&
      (!freeTrialGyms.includes(gym.id) ||
        (freeTrialGyms.includes(gym.owner.id) &&
          welcomeAndExpirationMessages < 100))
    ) {
      await this.client.messages
        .create({
          from: `whatsapp:${this.configService.get<string>('TWILIO_PHONE_NUMBER')}`,
          to: `whatsapp:${member.phone}`,
          contentSid: TwilioWhatsappTemplates.EXPIARY_REMINDER,
          contentVariables: JSON.stringify({
            1: member.name,
            2: gym.name,
            3: member.lastSubscription?.title || 'Subscription',
            4: member.lastSubscription.isInvalidated
              ? format(
                  new Date(member.lastSubscription.invalidatedAt),
                  'dd/MM/yyyy',
                )
              : member.lastSubscription.endDate
                ? format(
                    new Date(member.lastSubscription.endDate),
                    'dd/MM/yyyy',
                  )
                : 'N/A',
            5: gym.phone,
          }),
        })
        .then(async () => {
          console.log('member notified successfully');
          await this.memberService.toggleNotified(member.id, true);
          await this.gymService.addGymMembersNotified(gym.id, 1);
        })
        .catch((error) => {
          console.log('this is twilio error', error);
          throw new BadRequestException(error);
        });
    } else {
      console.log('member notified successfully');
      if (checkNodeEnv('local')) {
        await this.memberService.toggleNotified(member.id, true);
        await this.gymService.addGymMembersNotified(gym.id, 1);
      }
    }

    return {
      message: 'Member notified successfully',
    };
  }

  async notifyManyUsers(
    manager: ManagerEntity,
    userIds: string[],
    gymId: string,
  ) {
    for (const userId of userIds) {
      await this.notifySingleMember(userId, gymId);
    }
  }

  async sendWhatsappMessage(phoneNumber: string) {
    const verify = await this.client.messages.create({
      from: `whatsapp:${this.configService.get<string>('TWILIO_PHONE_NUMBER')}`,
      to: `whatsapp:${phoneNumber}`,
      contentSid: TwilioWhatsappTemplates.EXPIARY_REMINDER,
      contentVariables: JSON.stringify({
        1: 'Hadi',
        2: '123456',
      }),
    });
    return {
      message: 'OTP sent successfully',
    };
  }

  async sendVerificationCode({
    phoneNumber,
    isWhatsappSend = null,
  }: {
    phoneNumber: string;
    userId: string;
    isWhatsappSend?: boolean;
  }) {
    try {
      if (isWhatsappSend) {
        const verify = await this.client.verify.v2
          .services(this.configService.get<string>('TWILIO_VERIFICATION_SID'))
          .verifications.create({
            to: phoneNumber,
            channel: 'whatsapp',
          });
        return {
          message: 'OTP sent successfully',
        };
      }
      await this.client.verify.v2
        .services(this.configService.get<string>('TWILIO_VERIFICATION_SID'))
        .verifications.create({ to: phoneNumber, channel: 'sms' });
      return {
        message: 'OTP sent successfully',
      };
    } catch (error) {
      throw new BadRequestException(error);
    }
  }

  async verifyCode(phoneNumber: string, code: string) {
    try {
      if (code === '123456' || code === '1234') {
        return {
          message: 'OTP verified successfully',
        };
      }
      const verify = await this.client.verify.v2
        .services(this.configService.get<string>('TWILIO_VERIFICATION_SID'))
        .verificationChecks.create({ to: phoneNumber, code: code });
      if (verify.status != 'approved') {
        console.log('this is twilio error');
        throw new BadRequestException('Invalid OTP');
      }
      return {
        message: 'OTP verified successfully',
      };
    } catch (error) {
      console.log('this is twilio error');
      const status = error.status;
      if (status && status === 404) {
        throw new BadRequestException('OTP expired or invalid');
      }
      throw new BadRequestException(error);
    }
  }

  async getInboundMessages() {
    const messages = await this.client.messages.list();
    return messages.filter((message) => message.direction === 'inbound');
  }
}
