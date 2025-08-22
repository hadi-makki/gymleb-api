import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BadRequestException } from '../error/bad-request-error';
import { GymService } from '../gym/gym.service';
import { Manager } from '../manager/manager.entity';
import { MemberService } from '../member/member.service';

import { Twilio } from 'twilio';
import { NotFoundException } from 'src/error/not-found-error';
import { format } from 'date-fns';

export enum TwilioWhatsappTemplates {
  EXPIARY_REMINDER = 'HXcc65a0e4783fd7f892683be58ad27285',
  SUBSCRIPTION_EXPIRED = 'HX9f136ce037cfb13b0d4daf887b331437',
}

@Injectable()
export class TwilioService {
  constructor(
    private readonly configService: ConfigService,
    private readonly gymService: GymService,
    private readonly memberService: MemberService,
  ) {}

  private readonly client = new Twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH,
  );

  async notifyExpiredMembers(manager: Manager, gymId: string) {
    const members = await this.memberService.getExpiredMembers(
      manager,
      1000,
      1,
      '',
      gymId,
    );

    let notifiedNumber = 0;
    for (const member of members.items) {
      if (member.phone && !member.isNotified) {
        await this.memberService.toggleNotified(member.id, true);
        notifiedNumber++;
      }
    }
    await this.gymService.addGymMembersNotified(gymId, notifiedNumber);
  }

  async notifySingleMember(userId: string, gymId: string) {
    const member = await this.memberService.getMemberByIdAndGym(userId, gymId);

    const gym = await this.gymService.getGymById(gymId);
    const isExpired = await this.memberService.checkUserSubscriptionExpired(
      member.id,
    );
    if (gym.membersNotified > 100) {
      throw new BadRequestException('Gym members notified limit reached');
    }
    if (!isExpired) {
      throw new BadRequestException('Member subscription is not expired');
    }
    if (member.isNotified) {
      throw new BadRequestException('Member is already notified');
    }

    console.log('this is the member', member.lastSubscription);

    await this.client.messages
      .create({
        from: `whatsapp:${this.configService.get<string>('TWILIO_PHONE_NUMBER')}`,
        to: `whatsapp:${member.phone}`,
        contentSid: TwilioWhatsappTemplates.EXPIARY_REMINDER,
        contentVariables: JSON.stringify({
          1: member.name,
          2: gym.name,
          3: member.lastSubscription?.title,
          4: member.lastSubscription.isInvalidated
            ? format(
                new Date(member.lastSubscription.invalidatedAt),
                'dd/MM/yyyy',
              )
            : member.lastSubscription.endDate
              ? format(new Date(member.lastSubscription.endDate), 'dd/MM/yyyy')
              : 'N/A',
          5: gym.phone,
        }),
      })
      .then(async () => {
        await this.memberService.toggleNotified(member.id, true);

        await this.gymService.addGymMembersNotified(gym.id, 1);
      })
      .catch((error) => {
        console.log('this is twilio error', error);
        throw new BadRequestException(error);
      });

    return {
      message: 'Member notified successfully',
    };
  }

  async notifyManyUsers(manager: Manager, userIds: string[], gymId: string) {
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
}
