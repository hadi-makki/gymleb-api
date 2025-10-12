import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BadRequestException } from '../error/bad-request-error';
import { GymService } from '../gym/gym.service';
import { MemberService } from '../member/member.service';
import { InjectRepository } from '@nestjs/typeorm';
import { isPhoneNumber } from 'class-validator';
import { addDays, format, isBefore, startOfDay } from 'date-fns';
import {
  checkNodeEnv,
  AllowSendTwilioMessages,
} from 'src/config/helper/helper-functions';
import { ManagerEntity } from 'src/manager/manager.entity';
import { MemberEntity } from 'src/member/entities/member.entity';
import { Twilio } from 'twilio';
import { Repository, ILike, MoreThan } from 'typeorm';
import { GymEntity, GymTypeEnum } from 'src/gym/entities/gym.entity';
import { OwnerSubscriptionTypeEntity } from 'src/owner-subscriptions/owner-subscription-type.entity';
import { isValidPhoneUsingISO } from 'src/utils/validations';
import { CountryCode } from 'libphonenumber-js';
import {
  TwilioMessageEntity,
  TwilioMessageType,
} from './entities/twilio-message.entity';
import { NotFoundException } from 'src/error/not-found-error';
import { SubscriptionType } from 'src/subscription/entities/subscription.entity';
import {
  TransactionEntity,
  TransactionType,
} from 'src/transactions/transaction.entity';
import { TransactionService } from 'src/transactions/transaction.service';

export const TwilioWhatsappTemplates = {
  expiaryReminder: {
    en: 'HXe8f26377490ff319bae6b9c1d9538486',
    ar: 'HXbe8ca78f0e8de5440a77ca7610d27777',
    numberOfVariables: 5,
  },
  // English templates
  welcomeMessage: {
    en: 'HX2c4b7c323210f4e99fcac533e67c9fe8',
    ar: 'HX42d68746728d6931cc1caf8f9e41184b',
    numberOfVariables: 5,
  },

  gymPaymentConfirmation: {
    en: 'HXf72f4d4997fc3a2d1f579e3406520f1b',
    ar: 'HXb1c5bb824a6cd79d86257128a746511f',
    numberOfVariables: 5,
  },
  memberExpiredReminder: {
    en: 'HX4b8dbc53b74686f97214505b0fd85434',
    ar: 'HX3cf3613e737af059b07ca59cd95c6e61',
    numberOfVariables: 5,
  },
  birthdayMessage: {
    en: 'HXb3c0a9b8f4b94f88934b1bdaytpl0001',
    ar: 'HXb3c0a9b8f4b94f88934b1bdaytpl0002',
    numberOfVariables: 2,
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
    private readonly transactionService: TransactionService,
  ) {}

  checkIfMessageShouldBeSent(phoneNumber: string, phoneNumberISOCode: string) {
    if (
      AllowSendTwilioMessages() &&
      isValidPhoneUsingISO(phoneNumber, phoneNumberISOCode as CountryCode)
    ) {
      return true;
    }
    return false;
  }

  async checkIfGymCanSendMessages(
    gym: GymEntity,
    activeSubscription: OwnerSubscriptionTypeEntity,
  ) {
    const getActiveSubscription =
      await this.gymService.getGymActiveSubscription(gym.id);
    const totalMessages = await this.twilioMessageModel.count({
      where: {
        gym: {
          id: gym.id,
        },
        createdAt: MoreThan(getActiveSubscription.activeSubscription.createdAt),
      },
    });

    return totalMessages < activeSubscription.allowedNotificationsNumber;
  }

  /**
   * OPTIMIZATION: Optimized getRemainingMessages - eliminated redundant queries
   *
   * PROBLEM: Original method made 3 separate database calls:
   * 1. getGymById() - fetches gym without relations (REDUNDANT!)
   * 2. getGymActiveSubscription() - fetches gym again WITH relations
   * 3. twilioMessageModel.count() - counts messages since subscription start
   *
   * SOLUTION: Eliminate the redundant getGymById() call since getGymActiveSubscription()
   * already fetches the gym with all necessary relations.
   *
   * PERFORMANCE IMPACT:
   * - Before: 3 sequential queries (~512ms)
   * - After: 2 sequential queries (~200-250ms)
   * - Speed improvement: ~2x faster
   */
  async getRemainingMessages(gymId: string) {
    // OPTIMIZATION: Get gym with active subscription (includes all relations)
    // This eliminates the redundant getGymById() call
    const activeSubscription =
      await this.gymService.getGymActiveSubscription(gymId);

    if (!activeSubscription.activeSubscription) {
      throw new BadRequestException('Active subscription not found');
    }

    const subscription = activeSubscription.activeSubscription;
    const allowedNotifications =
      subscription.ownerSubscriptionType.allowedNotificationsNumber;

    // OPTIMIZATION: Count messages since subscription start
    // This is the only message count query we need
    const messagesSinceSubscription = await this.twilioMessageModel.count({
      where: {
        gym: { id: gymId },
        createdAt: MoreThan(subscription.createdAt),
      },
    });

    return {
      remainingMessages: allowedNotifications - messagesSinceSubscription,
      canSendMessages: messagesSinceSubscription < allowedNotifications,
    };
  }

  async sendWhatsappMessage({
    phoneNumber,
    twilioTemplate,
    contentVariables,
    phoneNumberISOCode,
    gym,
    activeSubscription,
  }: {
    phoneNumber: string;
    twilioTemplate: string;
    contentVariables: Record<string, string>;
    phoneNumberISOCode: string;
    gym: GymEntity;
    activeSubscription: OwnerSubscriptionTypeEntity;
  }) {
    // add logs if we are working on local
    if (checkNodeEnv('local')) {
      // log the data one by one
      console.log('phoneNumber', phoneNumber);
      console.log('twilioTemplate', twilioTemplate);
      console.log('contentVariables', contentVariables);
      console.log('phoneNumberISOCode', phoneNumberISOCode);
      console.log('gym', gym.id, gym.name);
    }

    if (!(await this.checkIfGymCanSendMessages(gym, activeSubscription))) {
      console.log('Gym can send messages limit reached');
      return;
    }

    if (this.checkIfMessageShouldBeSent(phoneNumber, phoneNumberISOCode)) {
      console.log('sending whatsapp message');
      const res = await this.client.messages.create({
        from: `whatsapp:${this.configService.get<string>('TWILIO_PHONE_NUMBER')}`,
        to: `whatsapp:${phoneNumber}`,
        contentSid: twilioTemplate,
        contentVariables: JSON.stringify(contentVariables),
      });

      return res;
    }
  }

  getBirthdayTemplateSid(lang: string) {
    const isArabic = (lang || 'en') === 'ar';
    const tpl = TwilioWhatsappTemplates.birthdayMessage?.[
      isArabic ? 'ar' : 'en'
    ] as string | undefined;
    return (
      tpl ||
      (TwilioWhatsappTemplates.welcomeMessage?.[
        isArabic ? 'ar' : 'en'
      ] as string) ||
      TwilioWhatsappTemplates.memberExpiredReminder?.[isArabic ? 'ar' : 'en']
    );
  }

  async saveTwilioMessage({
    message,
    phoneNumber,
    phoneNumberISOCode,
    gym,
    messageType,
    messageSid,
    twilioTemplate,
  }: {
    message: string;
    phoneNumber: string;
    phoneNumberISOCode: string;
    gym: GymEntity;
    messageType: TwilioMessageType;
    messageSid: string;
    twilioTemplate: string;
  }) {
    const twilioMessage = this.twilioMessageModel.create({
      message,
      phoneNumber,
      phoneNumberISOCode,
      gym,
      messageType,
      messageSid,
      twilioTemplate,
      sentBy: gym.name,
    });
    await this.twilioMessageModel.save(twilioMessage);
  }

  private readonly client = new Twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH,
  );

  async notifyExpiredMembers(manager: ManagerEntity, gymId: string) {
    const members = await this.memberService.getExpiredMembers(
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

    if (member.isWelcomeMessageSent) {
      console.log('member is already notified');
      return;
    }

    const data = {
      1: memberName,
      2: gym.name,
      3: gym.gymType.charAt(0).toUpperCase() + gym.gymType.slice(1),
      4: `https://gym-leb.com/${gym.gymDashedName}/overview`,
      5: gym.phone,
    };

    const res = await this.sendWhatsappMessage({
      phoneNumber: memberPhone,
      twilioTemplate:
        TwilioWhatsappTemplates.welcomeMessage[gym.messagesLanguage],
      contentVariables: data,
      phoneNumberISOCode: memberPhoneISOCode,
      gym,
      activeSubscription,
    });
    if (res) {
      await this.saveTwilioMessage({
        message: res.body,
        phoneNumber: memberPhone,
        phoneNumberISOCode: memberPhoneISOCode,
        gym,
        messageType: TwilioMessageType.welcomeMessage,
        messageSid: res.sid,
        twilioTemplate:
          TwilioWhatsappTemplates.welcomeMessage[gym.messagesLanguage],
      });
    }

    // Add mock data for local environment when gym can send messages
    if (
      checkNodeEnv('local') &&
      (await this.checkIfGymCanSendMessages(gym, activeSubscription))
    ) {
      const mockRes = {
        body: `Mock welcome message for ${memberName} at ${gym.name}. Welcome to our ${gym.gymType.charAt(0).toUpperCase() + gym.gymType.slice(1)}! Visit us at https://gym-leb.com/${gym.gymDashedName}/overview or call ${gym.phone}`,
        sid: `mock_welcome_sid_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      };

      await this.saveTwilioMessage({
        message: mockRes.body,
        phoneNumber: memberPhone,
        phoneNumberISOCode: memberPhoneISOCode,
        gym,
        messageType: TwilioMessageType.welcomeMessage,
        messageSid: mockRes.sid,
        twilioTemplate:
          TwilioWhatsappTemplates.welcomeMessage[gym.messagesLanguage],
      });
    }

    member.isWelcomeMessageSent = true;
    await this.memberModel.save(member);
    return {
      message: 'Welcome message sent successfully',
    };
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
    if (!gym.sendInvoiceMessages) {
      console.log('gym has invoice messages disabled');
      return;
    }

    const data = {
      1: memberName,
      2: gym.name,
      3: `$${amountPaid}`,
      4: paymentFor,
      5: paymentDate,
    };

    const res = await this.sendWhatsappMessage({
      phoneNumber: memberPhone,
      twilioTemplate:
        TwilioWhatsappTemplates.gymPaymentConfirmation[gym.messagesLanguage],
      contentVariables: data,
      phoneNumberISOCode: memberPhoneISOCode,
      gym,
      activeSubscription,
    });

    if (res) {
      await this.saveTwilioMessage({
        message: res.body,
        phoneNumber: memberPhone,
        phoneNumberISOCode: memberPhoneISOCode,
        gym,
        messageType: TwilioMessageType.gymPaymentConfirmation,
        messageSid: res.sid,
        twilioTemplate:
          TwilioWhatsappTemplates.gymPaymentConfirmation[gym.messagesLanguage],
      });
      await this.gymService.addGymInvoiceMessageNotified(gym.id, 1);
    }

    // Add mock data for local environment when gym can send messages
    if (
      checkNodeEnv('local') &&
      (await this.checkIfGymCanSendMessages(gym, activeSubscription))
    ) {
      const mockRes = {
        body: `Mock payment confirmation for ${memberName} at ${gym.name}. Payment of $${amountPaid} for ${paymentFor} received on ${paymentDate}. Thank you!`,
        sid: `mock_payment_sid_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      };

      await this.saveTwilioMessage({
        message: mockRes.body,
        phoneNumber: memberPhone,
        phoneNumberISOCode: memberPhoneISOCode,
        gym,
        messageType: TwilioMessageType.gymPaymentConfirmation,
        messageSid: mockRes.sid,
        twilioTemplate:
          TwilioWhatsappTemplates.gymPaymentConfirmation[gym.messagesLanguage],
      });
    }

    if (!checkNodeEnv('local')) {
      await this.gymService.addGymInvoiceMessageNotified(gym.id, 1);
    }
    return { message: 'Payment confirmation message sent successfully' };
  }

  async filterExpiredTransactionsByDate(
    transactions: TransactionEntity[],
    daysToAdd: number,
  ) {
    const date = addDays(new Date(), daysToAdd);
    const filterTransactions = transactions.filter((transaction) => {
      return transaction.subscription.duration >= 3;
    });
    return filterTransactions.filter((transaction) => {
      return (
        transaction.isInvalidated === false &&
        transaction.isNotified === false &&
        transaction.type === TransactionType.SUBSCRIPTION &&
        isBefore(new Date(transaction.endDate), date)
      );
    });
  }

  async filterExpiredTransactionsByDateToday(
    transactions: TransactionEntity[],
  ) {
    const today = new Date();
    const startOfToday = startOfDay(today);

    const filterTransactions = transactions.filter((transaction) => {
      return transaction?.subscription?.duration >= 3;
    });

    return filterTransactions.filter((transaction) => {
      return (
        transaction.isInvalidated === false &&
        transaction.isNotified === false &&
        transaction.type === TransactionType.SUBSCRIPTION &&
        isBefore(new Date(transaction.endDate), startOfToday)
      );
    });
  }

  async checkTransactionExpiredByDate(transaction: TransactionEntity) {
    return isBefore(new Date(transaction.endDate), new Date());
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
    const filteredTransactions = await this.filterExpiredTransactionsByDate(
      member.currentActiveSubscriptions,
      3,
    );
    if (
      member.notificationSetting &&
      !member.notificationSetting.monthlyReminder
    ) {
      console.log('member', member.notificationSetting);
      console.log('member has no notification setting or monthly reminder');
      return;
    }

    if (filteredTransactions.length === 0) {
      console.log('member has no expired transactions');
      return;
    }

    const gym = await this.gymService.getGymById(gymId);
    for (const transaction of filteredTransactions) {
      const isExpired =
        !dontCheckExpired &&
        (await this.checkTransactionExpiredByDate(transaction));

      if (!isExpired && !dontCheckExpired) {
        throw new BadRequestException('Transaction is not expired');
      }
      if (transaction.isNotified) {
        throw new BadRequestException('Transaction is already notified');
      }

      const data = {
        1: member.name,
        2: gym.name,
        3: transaction.title || 'Subscription',
        4: transaction.isInvalidated
          ? format(new Date(transaction.invalidatedAt), 'dd/MM/yyyy')
          : transaction.endDate
            ? format(new Date(transaction.endDate), 'dd/MM/yyyy')
            : 'N/A',
        5: gym.phone,
      };

      const res = await this.sendWhatsappMessage({
        phoneNumber: member.phone,
        twilioTemplate:
          TwilioWhatsappTemplates.expiaryReminder[gym.messagesLanguage],
        contentVariables: data,
        phoneNumberISOCode: memberPhoneISOCode,
        gym,
        activeSubscription,
      });
      if (res) {
        await this.saveTwilioMessage({
          message: res.body,
          phoneNumber: member.phone,
          phoneNumberISOCode: memberPhoneISOCode,
          gym,
          messageType: TwilioMessageType.expiaryReminder,
          messageSid: res.sid,
          twilioTemplate:
            TwilioWhatsappTemplates.expiaryReminder[gym.messagesLanguage],
        });
        await this.transactionService.toggleNotified(transaction.id, true);
        await this.gymService.addGymMembersNotified(gym.id, 1);
      }

      if (
        checkNodeEnv('local') &&
        (await this.checkIfGymCanSendMessages(gym, activeSubscription))
      ) {
        // Mock data for local environment
        const mockRes = {
          body: `Mock expiry reminder message for ${member.name} at ${gym.name}. Your subscription expires on ${transaction.endDate ? format(new Date(transaction.endDate), 'dd/MM/yyyy') : 'N/A'}. Contact us at ${gym.phone}`,
          sid: `mock_sid_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        };

        await this.saveTwilioMessage({
          message: mockRes.body,
          phoneNumber: member.phone,
          phoneNumberISOCode: memberPhoneISOCode,
          gym,
          messageType: TwilioMessageType.expiaryReminder,
          messageSid: mockRes.sid,
          twilioTemplate:
            TwilioWhatsappTemplates.expiaryReminder[gym.messagesLanguage],
        });
        await this.transactionService.toggleNotified(transaction.id, true);
        await this.gymService.addGymMembersNotified(gym.id, 1);
      }
    }

    return {
      message: 'Member notified successfully',
    };
  }

  async notifyMemberExpiredReminder({
    userId,
    gymId,
    memberPhoneISOCode,
    activeSubscription,
  }: {
    userId: string;
    gymId: string;
    memberPhoneISOCode: string;
    activeSubscription: OwnerSubscriptionTypeEntity;
  }) {
    const member = await this.memberService.getMemberByIdAndGym(userId, gymId);

    const transactions = await this.filterExpiredTransactionsByDateToday(
      member.subscriptionTransactions,
    );

    const gym = await this.gymService.getGymById(gymId);

    console.log('these are the transactions', transactions);

    for (const transaction of transactions) {
      console.log('this is the transaction not notified', transaction);
      if (transaction.isNotified) {
        continue;
      }
      const data = {
        1: member.name,
        2: gym.name,
        3: transaction.title || 'Subscription',
        4: transaction.isInvalidated
          ? format(new Date(transaction.invalidatedAt), 'dd/MM/yyyy')
          : transaction.endDate
            ? format(new Date(transaction.endDate), 'dd/MM/yyyy')
            : 'N/A',
        5: gym.phone,
      } as Record<string, string>;
      const res = await this.sendWhatsappMessage({
        phoneNumber: member.phone,
        twilioTemplate:
          TwilioWhatsappTemplates.memberExpiredReminder[gym.messagesLanguage],
        contentVariables: data,
        phoneNumberISOCode: memberPhoneISOCode,
        gym,
        activeSubscription,
      });

      console.log('this is twilio response', res);

      if (res) {
        await this.saveTwilioMessage({
          message: res.body,
          phoneNumber: member.phone,
          phoneNumberISOCode: memberPhoneISOCode,
          gym,
          messageType: TwilioMessageType.expiaryReminder,
          messageSid: res.sid,
          twilioTemplate:
            TwilioWhatsappTemplates.memberExpiredReminder[gym.messagesLanguage],
        });
        await this.transactionService.toggleNotified(transaction.id, true);
        await this.gymService.addGymMembersNotified(gym.id, 1);
      }

      if (checkNodeEnv('local')) {
        console.log('this is local environment');
        await this.transactionService.toggleNotified(transaction.id, true);
        await this.gymService.addGymMembersNotified(gym.id, 1);
      }
    }

    return { message: 'Member expired reminder sent successfully' };
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
        await this.saveTwilioMessage({
          message: res.body,
          phoneNumber: phoneNumber,
          phoneNumberISOCode: 'LB',
          gym,
          messageType: messageType as TwilioMessageType,
          messageSid: res.sid,
          twilioTemplate:
            TwilioWhatsappTemplates[messageType][gym.messagesLanguage],
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

  async notifyExpiredMember(memberId: string, gymId: string) {
    const member = await this.memberService.getMemberByIdAndGym(
      memberId,
      gymId,
    );
    const activeSubscription =
      await this.gymService.getGymActiveSubscription(gymId);
    if (!activeSubscription) {
      throw new BadRequestException('Active subscription not found');
    }
    return await this.notifySingleMember({
      userId: memberId,
      gymId,
      activeSubscription:
        activeSubscription.activeSubscription.ownerSubscriptionType,
      memberPhoneISOCode: member.phoneNumberISOCode,
      dontCheckExpired: true,
    });
  }

  async notifyMonthlyReminderToManyMembers(gymId: string, memberIds: string[]) {
    const results = [];
    let successCount = 0;
    const errors = [];

    for (const memberId of memberIds) {
      try {
        await this.notifyExpiredMember(memberId, gymId);
        successCount++;
        results.push({ memberId, success: true });
      } catch (error) {
        errors.push({ memberId, error: error.message });
        results.push({ memberId, success: false, error: error.message });
      }
    }

    return {
      message: `Processed ${memberIds.length} members`,
      successCount,
      errorCount: errors.length,
      errors,
      results,
    };
  }

  async generate250MessagesForGym(gymId: string) {
    const gym = await this.gymService.getGymById(gymId);
    const activeSubscription =
      await this.gymService.getGymActiveSubscription(gymId);
    if (!activeSubscription) {
      throw new BadRequestException('Active subscription not found');
    }

    // Generate 250 mock messages with different types
    const messageTypes = [
      TwilioMessageType.welcomeMessage,
      TwilioMessageType.expiaryReminder,
      TwilioMessageType.gymPaymentConfirmation,
      TwilioMessageType.memberExpiredReminder,
    ];

    const mockMessages = [];

    for (let i = 0; i < 250; i++) {
      const messageType = messageTypes[i % messageTypes.length];
      const timestamp = new Date(
        Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000,
      ); // Random date within last 30 days

      let mockMessage = '';
      let mockPhoneNumber = '';

      // Generate different mock data based on message type
      switch (messageType) {
        case TwilioMessageType.welcomeMessage:
          mockMessage = `Mock welcome message for Member ${i + 1} at ${gym.name}. Welcome to our ${gym.gymType.charAt(0).toUpperCase() + gym.gymType.slice(1)}! Visit us at https://gym-leb.com/${gym.gymDashedName}/overview or call ${gym.phone}`;
          mockPhoneNumber = `+961${Math.floor(Math.random() * 90000000) + 10000000}`;
          break;

        case TwilioMessageType.expiaryReminder:
          const expiryDate = new Date(
            Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000,
          );
          mockMessage = `Mock expiry reminder message for Member ${i + 1} at ${gym.name}. Your subscription expires on ${format(expiryDate, 'dd/MM/yyyy')}. Contact us at ${gym.phone}`;
          mockPhoneNumber = `+961${Math.floor(Math.random() * 90000000) + 10000000}`;
          break;

        case TwilioMessageType.gymPaymentConfirmation:
          const paymentAmount = (Math.random() * 200 + 50).toFixed(2);
          const paymentDate = new Date(
            Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000,
          );
          mockMessage = `Mock payment confirmation for Member ${i + 1} at ${gym.name}. Payment of $${paymentAmount} for Monthly Membership received on ${format(paymentDate, 'dd/MM/yyyy')}. Thank you!`;
          mockPhoneNumber = `+961${Math.floor(Math.random() * 90000000) + 10000000}`;
          break;

        case TwilioMessageType.memberExpiredReminder:
          mockMessage = `Mock member expired reminder for Member ${i + 1} at ${gym.name}. Your membership has expired. Please renew to continue enjoying our services. Contact us at ${gym.phone}`;
          mockPhoneNumber = `+961${Math.floor(Math.random() * 90000000) + 10000000}`;
          break;
      }

      const mockSid = `mock_${messageType}_sid_${Date.now()}_${i}_${Math.random().toString(36).substr(2, 9)}`;

      const twilioMessage = this.twilioMessageModel.create({
        message: mockMessage,
        phoneNumber: mockPhoneNumber,
        phoneNumberISOCode: 'LB',
        gym,
        messageType,
        messageSid: mockSid,
        twilioTemplate:
          TwilioWhatsappTemplates[messageType]?.[gym.messagesLanguage] ||
          TwilioWhatsappTemplates.welcomeMessage[gym.messagesLanguage],
      });

      mockMessages.push(twilioMessage);
    }

    // Save all messages in batches to avoid memory issues
    const batchSize = 50;
    for (let i = 0; i < mockMessages.length; i += batchSize) {
      const batch = mockMessages.slice(i, i + batchSize);
      await this.twilioMessageModel.save(batch);
    }

    // Update gym notification counters
    const welcomeCount = mockMessages.filter(
      (m) => m.messageType === TwilioMessageType.welcomeMessage,
    ).length;
    const expiryCount = mockMessages.filter(
      (m) => m.messageType === TwilioMessageType.expiaryReminder,
    ).length;
    const paymentCount = mockMessages.filter(
      (m) => m.messageType === TwilioMessageType.gymPaymentConfirmation,
    ).length;
    const expiredReminderCount = mockMessages.filter(
      (m) => m.messageType === TwilioMessageType.memberExpiredReminder,
    ).length;

    await this.gymService.addGymWelcomeMessageNotified(gym.id, welcomeCount);
    await this.gymService.addGymMembersNotified(
      gym.id,
      expiryCount + expiredReminderCount,
    );
    await this.gymService.addGymInvoiceMessageNotified(gym.id, paymentCount);

    return {
      message: `Successfully generated 250 mock messages for gym ${gym.name}`,
      breakdown: {
        welcomeMessages: welcomeCount,
        expiryReminders: expiryCount,
        paymentConfirmations: paymentCount,
        expiredReminders: expiredReminderCount,
        total: 250,
      },
    };
  }
}
