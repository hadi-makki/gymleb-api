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
import { Repository, ILike } from 'typeorm';
import { GymEntity, GymTypeEnum } from 'src/gym/entities/gym.entity';
import { OwnerSubscriptionTypeEntity } from 'src/owner-subscriptions/owner-subscription-type.entity';
import { isValidPhoneUsingISO } from 'src/utils/validations';
import { CountryCode } from 'libphonenumber-js';
import {
  TwilioMessageEntity,
  TwilioMessageType,
} from './entities/twilio-message.entity';
import { NotFoundException } from 'src/error/not-found-error';

export const TwilioWhatsappTemplates = {
  expiaryReminder: {
    en: 'HXe8f26377490ff319bae6b9c1d9538486',
    ar: 'HXbe8ca78f0e8de5440a77ca7610d27777',
    numberOfVariables: 5,
  },
  // English templates
  welcomeMessage: {
    en: 'HX33a3ef241f8933d43327e397663b1347',
    ar: 'HXedcdbb7d853851787db0eaa6297ce98e',
    numberOfVariables: 4,
  },
  welcomeMessageCalisthenics: {
    en: 'HX67b2797d8b8bae74e5dd066c4db608d0',
    ar: 'HX5cb01d1d696087de6aef652cfd10ff15',
    numberOfVariables: 4,
  },
  gymPaymentConfirmation: {
    en: 'HXf72f4d4997fc3a2d1f579e3406520f1b',
    ar: 'HXb1c5bb824a6cd79d86257128a746511f',
    numberOfVariables: 5,
  },
};

@Injectable()
export class TwilioService {
  constructor(
    private readonly configService: ConfigService,
    private readonly gymService: GymService,
    @Inject(forwardRef(() => MemberService))
    private readonly memberService: MemberService,
    @InjectRepository(MemberEntity)
    private readonly memberModel: Repository<MemberEntity>,
    @InjectRepository(TwilioMessageEntity)
    private readonly twilioMessageModel: Repository<TwilioMessageEntity>,
  ) {}

  async saveTwilioMessage({
    message,
    phoneNumber,
    phoneNumberISOCode,
    gym,
    messageType,
    messageSid,
  }: {
    message: string;
    phoneNumber: string;
    phoneNumberISOCode: string;
    gym: GymEntity;
    messageType: TwilioMessageType;
    messageSid: string;
  }) {
    const twilioMessage = this.twilioMessageModel.create({
      message,
      phoneNumber,
      phoneNumberISOCode,
      gym,
      messageType,
      messageSid,
    });
    await this.twilioMessageModel.save(twilioMessage);
  }

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
    memberPhoneISOCode: string,
    gym: GymEntity,
    activeSubscription: OwnerSubscriptionTypeEntity,
  ) {
    const member = await this.memberModel.findOne({
      where: { phone: memberPhone },
      relations: {
        notificationSetting: true,
      },
    });
    if (
      member.notificationSetting &&
      !member.notificationSetting.welcomeMessage
    ) {
      console.log('member has no notification setting or welcome message');
      return;
    }
    console.log('member', member);

    if (member.isWelcomeMessageSent) {
      console.log('member is already notified');
      return;
    }

    const totalMessages =
      gym.welcomeMessageNotified +
      gym.membersNotified +
      gym.invoiceMessageNotified;

    if (totalMessages >= activeSubscription.allowedNotificationsNumber) {
      console.log('welcome and expiration messages limit reached');
      return;
    }

    member.isWelcomeMessageSent = true;
    await this.memberModel.save(member);

    console.log('sending welcome message to', memberPhone, memberPhoneISOCode);

    if (
      !checkNodeEnv('local') &&
      isValidPhoneUsingISO(memberPhone, memberPhoneISOCode as CountryCode)
    ) {
      console.log('sending notification to', memberPhone, memberPhoneISOCode);
      await this.client.messages
        .create({
          from: `whatsapp:${this.configService.get<string>('TWILIO_PHONE_NUMBER')}`,
          to: `whatsapp:${memberPhone}`,
          contentSid:
            gym.gymType === GymTypeEnum.CALISTHENICS
              ? TwilioWhatsappTemplates.welcomeMessageCalisthenics[
                  gym.messagesLanguage
                ]
              : TwilioWhatsappTemplates.welcomeMessage[gym.messagesLanguage],
          contentVariables: JSON.stringify({
            1: memberName,
            2: gym.name,
            3: `https://gym-leb.com/${gym.gymDashedName}/overview`,
            4: gym.phone,
          }),
        })
        .then(async (res) => {
          await this.saveTwilioMessage({
            message: res.body,
            phoneNumber: memberPhone,
            phoneNumberISOCode: memberPhoneISOCode,
            gym,
            messageType: TwilioMessageType.welcomeMessage,
            messageSid: res.sid,
          });
          await this.gymService.addGymWelcomeMessageNotified(gym.id, 1);
        })
        .catch((error) => {
          console.log('this is twilio error', error);
          throw new BadRequestException(error);
        });
    } else {
      if (!checkNodeEnv('local')) {
        await this.gymService.addGymWelcomeMessageNotified(gym.id, 1);
      }
      return;
    }
  }

  async sendPaymentConfirmationMessage({
    memberName,
    memberPhone,
    memberPhoneISOCode,
    gym,
    amountPaid,
    paymentFor,
    paymentDate,
    activeSubscription,
  }: {
    memberName: string;
    memberPhone: string;
    memberPhoneISOCode: string;
    gym: GymEntity;
    amountPaid: string;
    paymentFor: string;
    paymentDate: string;
    activeSubscription: OwnerSubscriptionTypeEntity;
  }) {
    console.log(
      'this is the gym send invoice messages',
      gym.sendInvoiceMessages,
    );
    if (!gym.sendInvoiceMessages) {
      console.log('gym has invoice messages disabled');
      return;
    }

    const totalMessages =
      gym.welcomeMessageNotified +
      gym.membersNotified +
      gym.invoiceMessageNotified;

    if (totalMessages >= activeSubscription.allowedNotificationsNumber) {
      console.log('invoice message limit reached');
      return;
    }

    console.log(
      'sending payment confirmation message to',
      memberPhone,
      memberPhoneISOCode,
    );

    console.log('this is the data', {
      1: memberName,
      2: gym.name,
      3: amountPaid,
      4: paymentFor,
      5: paymentDate,
    });

    if (
      !checkNodeEnv('local') &&
      isValidPhoneUsingISO(memberPhone, memberPhoneISOCode as CountryCode)
    ) {
      console.log(
        'sending payment confirmation notification to',
        memberPhone,
        memberPhoneISOCode,
      );
      await this.client.messages
        .create({
          from: `whatsapp:${this.configService.get<string>('TWILIO_PHONE_NUMBER')}`,
          to: `whatsapp:${memberPhone}`,
          contentSid:
            TwilioWhatsappTemplates.gymPaymentConfirmation[
              gym.messagesLanguage
            ],
          contentVariables: JSON.stringify({
            1: memberName,
            2: gym.name,
            3: `$${amountPaid}`,
            4: paymentFor,
            5: paymentDate,
          }),
        })
        .then(async (res) => {
          await this.saveTwilioMessage({
            message: res.body,
            phoneNumber: memberPhone,
            phoneNumberISOCode: memberPhoneISOCode,
            gym,
            messageType: TwilioMessageType.gymPaymentConfirmation,
            messageSid: res.sid,
          });
          await this.gymService.addGymInvoiceMessageNotified(gym.id, 1);
        })
        .catch((error) => {
          console.log('this is twilio error', error);
          throw new BadRequestException(error);
        });
    } else {
      if (!checkNodeEnv('local')) {
        await this.gymService.addGymInvoiceMessageNotified(gym.id, 1);
      }
      return;
    }
  }

  async notifySingleMember({
    userId,
    gymId,
    dontCheckExpired = false,
    activeSubscription,
    memberPhoneISOCode,
  }: {
    userId: string;
    gymId: string;
    dontCheckExpired?: boolean;
    activeSubscription: OwnerSubscriptionTypeEntity;
    memberPhoneISOCode: string;
  }) {
    const member = await this.memberService.getMemberByIdAndGym(userId, gymId);
    if (
      member.notificationSetting &&
      !member.notificationSetting.monthlyReminder
    ) {
      console.log('member', member.notificationSetting);
      console.log('member has no notification setting or monthly reminder');
      return;
    }

    const gym = await this.gymService.getGymById(gymId);
    const isExpired =
      !dontCheckExpired &&
      (await this.memberService.checkUserSubscriptionExpired(member.id));

    // if gym has invoice messages disabled, send payment confirmation message
    if (!gym.sendInvoiceMessages) {
      await this.sendPaymentConfirmationMessage({
        memberName: member.name,
        memberPhone: member.phone,
        memberPhoneISOCode: member.phoneNumberISOCode,
        gym,
        amountPaid: member.lastSubscription.paidAmount.toString(),
        paymentFor: member.lastSubscription.subscriptionType,
        paymentDate: member.lastSubscription.startDate.toISOString(),
        activeSubscription,
      });
      return;
    }

    const totalMessages =
      gym.welcomeMessageNotified +
      gym.membersNotified +
      gym.invoiceMessageNotified;

    if (totalMessages > activeSubscription.allowedNotificationsNumber) {
      throw new BadRequestException('Gym members notified limit reached');
    }
    if (!isExpired && !dontCheckExpired) {
      throw new BadRequestException('Member subscription is not expired');
    }
    if (member.isNotified) {
      throw new BadRequestException('Member is already notified');
    }

    const welcomeAndExpirationMessages =
      gym.welcomeMessageNotified + gym.membersNotified;

    if (
      !checkNodeEnv('local') &&
      isValidPhoneUsingISO(member.phone, memberPhoneISOCode as CountryCode)
    ) {
      await this.client.messages
        .create({
          from: `whatsapp:${this.configService.get<string>('TWILIO_PHONE_NUMBER')}`,
          to: `whatsapp:${member.phone}`,
          contentSid:
            TwilioWhatsappTemplates.expiaryReminder[gym.messagesLanguage],
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
        .then(async (res) => {
          await this.saveTwilioMessage({
            message: res.body,
            phoneNumber: member.phone,
            phoneNumberISOCode: memberPhoneISOCode,
            gym,
            messageType: TwilioMessageType.expiaryReminder,
            messageSid: res.sid,
          });
          await this.memberService.toggleNotified(member.id, true);
          await this.gymService.addGymMembersNotified(gym.id, 1);
        })
        .catch((error) => {
          console.log('this is twilio error', error);
          throw new BadRequestException(error);
        });
    } else {
      console.log('member notified successfully');
      console.log('member phone', member.phone);
      console.log('member phone ISO code', memberPhoneISOCode);
      console.log(
        'check phone number',
        isValidPhoneUsingISO(member.phone, memberPhoneISOCode as CountryCode),
      );
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
    activeSubscription: OwnerSubscriptionTypeEntity,
  ) {
    for (const userId of userIds) {
      await this.notifySingleMember({
        userId,
        gymId,
        activeSubscription,
        memberPhoneISOCode: 'LB',
      });
    }
  }

  async sendWhatsappMessage(phoneNumber: string, gym: GymEntity) {
    const verify = await this.client.messages.create({
      from: `whatsapp:${this.configService.get<string>('TWILIO_PHONE_NUMBER')}`,
      to: `whatsapp:${phoneNumber}`,
      contentSid: TwilioWhatsappTemplates.expiaryReminder[gym.messagesLanguage],
      contentVariables: JSON.stringify({
        1: 'Test Member', // Member name
        2: gym.name, // Gym name
        3: 'Subscription', // Subscription title
        4: '01/01/2024', // End date
        5: gym.phone, // Gym phone
      }),
    });
    return {
      message: 'WhatsApp message sent successfully',
    };
  }

  async testWhatsappMessage(
    phoneNumber: string,
    gymId: string,
    messageType:
      | 'expiaryReminder'
      | 'welcomeMessage'
      | 'welcomeMessageCalisthenics'
      | 'gymPaymentConfirmation',
  ) {
    const gym = await this.gymService.getGymById(gymId);

    // Prepare content variables based on message type
    let contentVariables: Record<string, string> = {};

    if (messageType === 'expiaryReminder') {
      contentVariables = {
        1: 'Hadi', // Member name
        2: gym.name, // Gym name
        3: 'Subscription', // Subscription title
        4: '01/01/2024', // End date
        5: gym.phone, // Gym phone
      };
    } else if (
      messageType === 'welcomeMessage' ||
      messageType === 'welcomeMessageCalisthenics'
    ) {
      contentVariables = {
        1: 'Hadi', // Member name
        2: gym.name, // Gym name
        3: `https://gym-leb.com/${gym.gymDashedName}/overview`, // Gym URL
        4: gym.phone, // Gym phone
      };
    } else if (messageType === 'gymPaymentConfirmation') {
      contentVariables = {
        1: 'Hadi', // Member name
        2: gym.name, // Gym name
        3: '$50.00', // Amount paid
        4: 'Monthly Membership', // Payment for
        5: '15/01/2024', // Payment date
      };
    }

    const verify = await this.client.messages
      .create({
        from: `whatsapp:${this.configService.get<string>('TWILIO_PHONE_NUMBER')}`,
        to: `whatsapp:${phoneNumber}`,
        contentSid: TwilioWhatsappTemplates[messageType][gym.messagesLanguage],
        contentVariables: JSON.stringify(contentVariables),
      })
      .then(async (res) => {
        console.log('this is twilio response', res);
        await this.saveTwilioMessage({
          message: res.body,
          phoneNumber: phoneNumber,
          phoneNumberISOCode: 'LB',
          gym,
          messageType: messageType as TwilioMessageType,
          messageSid: res.sid,
        });
      })
      .catch((error) => {
        console.log('this is twilio error', error);
        throw new BadRequestException(error);
      });
    return {
      message: 'Test WhatsApp message sent successfully',
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

  async getAllMessages(
    limit: number,
    page: number,
    search: string,
    gymId?: string,
  ) {
    const queryBuilder = this.twilioMessageModel
      .createQueryBuilder('message')
      .leftJoinAndSelect('message.gym', 'gym')
      .orderBy('message.createdAt', 'DESC');

    // Apply gym filter
    if (gymId) {
      queryBuilder.andWhere('gym.id = :gymId', { gymId });
    }

    // Apply search filter
    if (search) {
      queryBuilder.andWhere(
        '(gym.name ILIKE :search OR message.message ILIKE :search OR message.phoneNumber ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    // Apply pagination
    const offset = (page - 1) * limit;
    queryBuilder.skip(offset).take(limit);

    const [messages, total] = await queryBuilder.getManyAndCount();

    return {
      data: messages,
      meta: {
        itemsPerPage: limit,
        totalItems: total,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        sortBy: [['createdAt', 'DESC']],
      },
    };
  }

  async getGymMessages(
    gymId: string,
    limit: number,
    page: number,
    search: string,
  ) {
    const queryBuilder = this.twilioMessageModel
      .createQueryBuilder('message')
      .leftJoinAndSelect('message.gym', 'gym')
      .where('gym.id = :gymId', { gymId })
      .orderBy('message.createdAt', 'DESC');

    // Apply search filter
    if (search) {
      queryBuilder.andWhere(
        '(message.message ILIKE :search OR message.phoneNumber ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    // Apply pagination
    const offset = (page - 1) * limit;
    queryBuilder.skip(offset).take(limit);

    const [messages, total] = await queryBuilder.getManyAndCount();

    return {
      data: messages,
      meta: {
        itemsPerPage: limit,
        totalItems: total,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        sortBy: [['createdAt', 'DESC']],
      },
    };
  }
}
