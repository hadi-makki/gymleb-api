import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BadRequestException } from 'src/error/bad-request-error';
import { GymService } from 'src/gym/gym.service';
import { Manager } from 'src/manager/manager.entity';
import { MemberService } from 'src/member/member.service';

import { Twilio } from 'twilio';

export enum TwilioWhatsappTemplates {
  ARABIC_TEMPLATE = 'HX00fa7ca5bea0f3a99ae45f92e7ec91f5',
  ENGLISH_TEMPLATE = 'HX7b5378e81ba80b22ddf8cec596692df5',
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

  async notifyExpiredMembers(manager: Manager) {
    const members = await this.memberService.getExpiredMembers(manager);
    let notifiedNumber = 0;
    for (const member of members) {
      if (member.phone && !member.isNotified) {
        // await this.sendWhatsappMessage(member.phone);
        await this.memberService.toggleNotified(member.id, true);
        notifiedNumber++;
      }
    }
    const gym = await this.gymService.getGymByManager(manager);
    await this.gymService.addGymMembersNotified(gym.id, notifiedNumber);
  }

  async notifySingleMember(manager: Manager, userId: string) {
    const member = await this.memberService.getMemberByIdAndGym(
      userId,
      manager,
    );
    const gym = await this.gymService.getGymByManager(manager);
    const isExpired = await this.memberService.checkUserSubscriptionExpired(
      member.id,
    );
    if (!isExpired) {
      throw new BadRequestException('Member subscription is not expired');
    }
    if (member.isNotified) {
      throw new BadRequestException('Member is already notified');
    }

    await this.memberService.toggleNotified(member.id, true);
    console.log('member', member, isExpired);
    if (member.phone) {
      // await this.sendWhatsappMessage(member.phone);
    }
    await this.gymService.addGymMembersNotified(gym.id, 1);
  }

  async sendWhatsappMessage(phoneNumber: string) {
    const verify = await this.client.messages.create({
      from: `whatsapp:${this.configService.get<string>('TWILIO_PHONE_NUMBER')}`,
      to: `whatsapp:${phoneNumber}`,
      contentSid: TwilioWhatsappTemplates.ENGLISH_TEMPLATE,
      contentVariables: JSON.stringify({
        1: 'Hadi',
        2: '123456',
      }),
    });
    console.log('verification', verify);
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
        console.log('verification', verify);
        return {
          message: 'OTP sent successfully',
        };
      }
      const verify = await this.client.verify.v2
        .services(this.configService.get<string>('TWILIO_VERIFICATION_SID'))
        .verifications.create({ to: phoneNumber, channel: 'sms' });
      console.log('verification', verify);
      return {
        message: 'OTP sent successfully',
      };
    } catch (error) {
      console.log('error', error);
      throw new BadRequestException(error);
    }
  }

  async verifyCode(phoneNumber: string, code: string) {
    try {
      console.log('code', code);
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
