import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { isUUID } from 'class-validator';
import { addDays, endOfDay, isBefore, isSameDay, startOfDay } from 'date-fns';
import { Response } from 'express';
import { FilterOperator, paginate } from 'nestjs-paginate';
import { GymEntity } from 'src/gym/entities/gym.entity';
import { GymService } from 'src/gym/gym.service';
import { PTSessionEntity } from 'src/personal-trainers/entities/pt-sessions.entity';
import { ManagerEntity } from 'src/manager/manager.entity';
import { PersonalTrainersService } from 'src/personal-trainers/personal-trainers.service';
import {
  SubscriptionEntity,
  SubscriptionType,
} from 'src/subscription/entities/subscription.entity';
import {
  TransactionEntity,
  TransactionType,
} from 'src/transactions/transaction.entity';
import { TwilioService } from 'src/twilio/twilio.service';
import { CookieNames, cookieOptions } from 'src/utils/constants';
import { Between, In, LessThan, MoreThan, Not, Repository } from 'typeorm';
import { MemberReservationEntity } from './entities/member-reservation.entity';
import { BadRequestException } from '../error/bad-request-error';
import { NotFoundException } from '../error/not-found-error';
import { MediaService } from '../media/media.service';
import { TokenService } from '../token/token.service';
import { TransactionService } from '../transactions/transaction.service';
import { CreateMemberDto } from './dto/create-member.dto';
import { LoginMemberDto } from './dto/login-member.dto';
import { ReturnUserDto } from './dto/return-user.dto';
import { UpdateMemberDto } from './dto/update-member.dto';
import { SignupMemberDto } from './dto/signup-member.dto';
import { MemberEntity } from './entities/member.entity';
import {
  MemberAttendingDaysEntity,
  DayOfWeek,
} from './entities/member-attending-days.entity';
import {
  AttendingDayDto,
  UpdateAttendingDaysDto,
} from './dto/attending-day.dto';
import { UpdateTrainingPreferencesDto } from './dto/update-training-preferences.dto';
import { UpdateHealthInformationDto } from './dto/update-health-information.dto';
import { ExtendMembershipDurationDto } from './dto/extend-membership-duration.dto';
import { UpdateProgramLinkDto } from './dto/update-program-link.dto';
import { NotificationSettingEntity } from 'src/notification-settings/entities/notification-setting.entity';
import { format } from 'date-fns';
import { IsNull } from 'typeorm';

@Injectable()
export class MemberService {
  constructor(
    @InjectRepository(MemberEntity)
    private memberModel: Repository<MemberEntity>,
    @InjectRepository(GymEntity)
    private gymModel: Repository<GymEntity>,
    @InjectRepository(SubscriptionEntity)
    private subscriptionModel: Repository<SubscriptionEntity>,
    @InjectRepository(MemberAttendingDaysEntity)
    private attendingDaysModel: Repository<MemberAttendingDaysEntity>,
    private readonly transactionService: TransactionService,
    private readonly tokenService: TokenService,
    private readonly mediaService: MediaService,
    @InjectRepository(TransactionEntity)
    private readonly transactionModel: Repository<TransactionEntity>,
    private readonly twilioService: TwilioService,
    private readonly personalTrainersService: PersonalTrainersService,
    private readonly gymService: GymService,
    @InjectRepository(PTSessionEntity)
    private readonly ptSessionRepository: Repository<PTSessionEntity>,
    @InjectRepository(MemberReservationEntity)
    private readonly reservationModel: Repository<MemberReservationEntity>,
    @InjectRepository(NotificationSettingEntity)
    private readonly notificationSettingModel: Repository<NotificationSettingEntity>,
  ) {}

  async checkIfUserHasActiveSubscription(memberId: string) {
    const activeSubscription = await this.transactionModel.find({
      where: {
        member: { id: memberId },
        endDate: MoreThan(new Date()),
        isInvalidated: false,
      },
      relations: {
        subscription: true,
      },
      order: { endDate: 'DESC' },
    });
    return activeSubscription;
  }

  async processBirthdayAutomationForGym(gym: GymEntity) {
    // Ensure gym includes ownerSubscriptionType
    const gymWithSettings = await this.gymModel.findOne({
      where: { id: typeof gym === 'string' ? gym : gym.id },
      relations: { ownerSubscriptionType: true },
    });
    if (!gymWithSettings || !gymWithSettings.enableBirthdayAutomation) {
      return;
    }

    const today = new Date();
    // Fetch only members with non-null birthdays and not yet handled in this gym
    const members = await this.memberModel.find({
      where: {
        gym: { id: gymWithSettings.id },
        birthday: Not(IsNull()),
        isBirthdayHandled: false,
      },
      relations: {
        gym: true,
        subscription: true,
        transactions: true,
      },
    });

    for (const member of members) {
      console.log('member', member.birthday);
      if (!member.birthday) continue;
      const isBirthdayToday = isSameDay(member.birthday, today);
      if (isBirthdayToday) {
        console.log('isBirthdayToday');
        // Send birthday message
        if (gymWithSettings.sendBirthdayMessage) {
          const activeSubscription =
            await this.gymService.getGymActiveSubscription(gymWithSettings.id);
          await this.twilioService.sendWhatsappMessage({
            phoneNumber: member.phone,
            twilioTemplate: this.twilioService.getBirthdayTemplateSid(
              gymWithSettings.messagesLanguage,
            ),
            contentVariables: {
              name: member.name,
              gymName: gymWithSettings.name,
            },
            phoneNumberISOCode: member.phoneNumberISOCode,
            gym: gymWithSettings,
            activeSubscription:
              activeSubscription.activeSubscription.ownerSubscriptionType,
          });

          // Increment birthday messages counter (non-blocking)
          await this.gymService.addGymBirthdayMessageNotified(
            gymWithSettings.id,
            1,
          );
        }

        console.log(
          'gymWithSettings.grantBirthdaySubscription',
          gymWithSettings.grantBirthdaySubscription,
        );

        // Grant subscription
        if (
          gymWithSettings.grantBirthdaySubscription &&
          gymWithSettings.birthdaySubscriptionId
        ) {
          console.log('grant birthday subscription');
          const getMemberActiveSubscription = await this.getActiveSubscription(
            member.id,
          );
          const getSubscription = await this.subscriptionModel.findOne({
            where: { id: gymWithSettings.birthdaySubscriptionId },
          });
          if (getMemberActiveSubscription.length === 0) {
            console.log('add subscription to member');
            await this.addSubscriptionToMember({
              memberId: member.id,
              subscriptionId: gymWithSettings.birthdaySubscriptionId,
              gymId: gymWithSettings.id,
              giveFullDay: true, // giveFullDay
              forFree: true, // forFree
            });
          } else {
            console.log('extend membership duration');
            await this.extendMembershipDuration(
              member.id,
              gymWithSettings.id,
              {
                days: getSubscription.duration,
              },
              getMemberActiveSubscription[0].id,
            );
          }
        }

        // Mark as handled to avoid duplicate processing
        const reGetMember = await this.memberModel.findOne({
          where: { id: member.id },
        });
        reGetMember.isBirthdayHandled = true;
        await this.memberModel.save(reGetMember);
      }
    }
  }

  async getLatestSubscription(
    memberId: string,
    withSubscription: boolean = false,
  ) {
    const latestSubscription = await this.transactionModel.findOne({
      where: { member: { id: memberId } },
      order: { createdAt: 'DESC' },
      relations: {
        ...(withSubscription && { subscription: true }),
      },
    });

    return latestSubscription;
  }

  async getActiveSubscription(memberId: string) {
    const member = await this.memberModel.findOne({
      where: { id: memberId },
    });
    if (!member) {
      throw new NotFoundException('Member not found');
    }

    // Use database query to find active subscription
    const activeSubscription =
      await this.checkIfUserHasActiveSubscription(memberId);

    return activeSubscription;
  }

  async getMembersWithExpiringSubscriptions({
    days,
    isNotified = false,
    ignoreMemberWhereGymDisabledMonthlyReminder = false,
  }: {
    days: number;
    isNotified?: boolean;
    ignoreMemberWhereGymDisabledMonthlyReminder?: boolean;
  }) {
    // Calculate the target date (X days from now)
    const targetDate = addDays(new Date(), days);

    // Set time range for the target date using date-fns
    const startOfTargetDate = startOfDay(new Date());
    const endOfTargetDate = endOfDay(targetDate);

    // Find all transactions that will expire on the target date
    const expiringTransactions = await this.transactionModel.find({
      where: [
        {
          endDate: Between(startOfTargetDate, endOfTargetDate),
          type: TransactionType.SUBSCRIPTION,
          isInvalidated: false,
          isNotified: false,
          subscription: {
            type: Not(SubscriptionType.DAILY_GYM),
            duration: Not(LessThan(7)),
          },
          ...(ignoreMemberWhereGymDisabledMonthlyReminder && {
            gym: {
              sendMonthlyReminder: true,
            },
          }),
        },
      ],
      relations: {
        gym: true,
        member: true,
        subscription: true,
      },
    });

    console.log(
      'this is the expiring transactions',
      expiringTransactions.length,
    );

    const newMembers = expiringTransactions
      .filter((t) => {
        return t.member;
      })
      .map((t) => {
        return {
          ...t,
          expiringSubscription: t,
        };
      });

    // Return members with their expiring subscription details
    return newMembers;
  }

  async returnMember(member: MemberEntity): Promise<ReturnUserDto> {
    if (!member) {
      throw new BadRequestException('Member data is required');
    }

    // Use SQL queries to get subscription data efficiently
    const [
      activeSubscriptions,
      lastSubscription,
      attendingDays,
      reservations,
      notificationSetting,
    ] = await Promise.all([
      // Get active subscription using SQL
      this.checkIfUserHasActiveSubscription(member.id),

      // Get last subscription using SQL
      this.getLatestSubscription(member.id),

      // Get attending days using SQL (only if not already loaded)
      member.attendingDays ||
        this.attendingDaysModel.find({
          where: { member: { id: member.id } },
          order: { dayOfWeek: 'ASC' },
        }),
      // Get active reservations for this member in their gym
      this.reservationModel.find({
        where: { member: { id: member.id }, isActive: true },
        relations: ['gym'],
        order: { reservationDate: 'ASC', startTime: 'ASC' },
      }),
      this.notificationSettingModel.findOne({
        where: { id: member.notificationSettingId },
      }),
    ]);

    return {
      id: member.id,
      name: member.name,
      email: member.email,
      phone: member.phone,
      gym: member.gym,
      subscription: member.subscription,
      subscriptionTransactions: member.transactions,
      createdAt: member.createdAt,
      updatedAt: member.updatedAt,
      hasActiveSubscription: activeSubscriptions.length > 0,
      currentActiveSubscriptions: activeSubscriptions,
      lastSubscription: lastSubscription,
      isNotified: member.isNotified,
      profileImage: member.profileImage,
      attendingDays: attendingDays,
      reservations,
      allowedReservations: member.allowedReservations,
      usedReservations: member.usedReservations,
      trainingLevel: member.trainingLevel,
      trainingGoals: member.trainingGoals,
      trainingPreferences: member.trainingPreferences,
      trainingPrograms: member.trainingPrograms,
      weight: member.weight,
      height: member.height,
      waistWidth: member.waistWidth,
      chestWidth: member.chestWidth,
      armWidth: member.armWidth,
      thighWidth: member.thighWidth,
      bodyFatPercentage: member.bodyFatPercentage,
      muscleMass: member.muscleMass,
      bmi: member.bmi,
      bloodType: member.bloodType,
      allergies: member.allergies,
      medicalConditions: member.medicalConditions,
      medications: member.medications,
      emergencyContact: member.emergencyContact,
      emergencyPhone: member.emergencyPhone,
      birthday: member.birthday,
      lastHealthCheck: member.lastHealthCheck?.toISOString(),
      programLink: member.programLink,
      isWelcomeMessageSent: member.isWelcomeMessageSent,
      notificationSetting: notificationSetting,
      phoneNumberISOCode: member.phoneNumberISOCode,
      welcomeMessageSentManually: member.welcomeMessageSentManually,
    };
  }

  async create(
    createMemberDto: CreateMemberDto,
    manager: ManagerEntity,
    gymId: string,
    image?: Express.Multer.File,
  ) {
    console.log('this is the paid amount', createMemberDto.paidAmount);
    const gym = await this.gymModel.findOne({
      where: { id: gymId },
    });
    if (!gym) {
      throw new NotFoundException('Gym not found');
    }

    const subscription = await this.subscriptionModel.findOne({
      where: { id: createMemberDto.subscriptionId },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    const checkIfNameExists = await this.memberModel.findOne({
      where: {
        name: createMemberDto.name,
        gym: { id: gym.id },
      },
    });
    const checkIfPhoneExists = await this.memberModel.exists({
      where: {
        phone: createMemberDto.phoneNumber,
        gym: { id: gym.id },
      },
    });

    const checkIfEmailExists = createMemberDto.email
      ? await this.memberModel.exists({
          where: {
            email: createMemberDto.email,
            gym: { id: gym.id },
          },
        })
      : false;

    if (checkIfNameExists) {
      throw new BadRequestException('Name already exists');
    }

    if (checkIfPhoneExists) {
      throw new BadRequestException('Phone already exists');
    }

    if (checkIfEmailExists && createMemberDto.email) {
      throw new BadRequestException('Email already exists');
    }

    const createMemberModel = this.memberModel.create({
      name: createMemberDto.name,
      ...(createMemberDto.email && { email: createMemberDto.email }),
      phone: createMemberDto.phoneNumber,
      phoneNumberISOCode: createMemberDto.phoneNumberISOCode,
      gym: gym,
      subscription: subscription,
      allowedReservations: subscription.allowedReservations ?? 0,
      usedReservations: 0,
    });
    const member = await this.memberModel.save(createMemberModel);
    // Optional image upload and assignment
    if (image) {
      const imageData = await this.mediaService.upload(image, manager.id);
      member.profileImage = imageData.id as any;
      await this.memberModel.save(member);
    }
    const subscriptionInstance =
      await this.transactionService.createSubscriptionInstance({
        member: member,
        gym: gym,
        subscription: subscription,
        subscriptionType: subscription.type,
        amount: subscription.price,
        giveFullDay: createMemberDto.giveFullDay,
        startDate: createMemberDto.startDate,
        endDate: createMemberDto.endDate,
        willPayLater: createMemberDto.willPayLater,
        paidAmount: createMemberDto.paidAmount,
      });

    member.transactions = [subscriptionInstance];

    const createdNotificationSetting = this.notificationSettingModel.create({
      welcomeMessage: true,
      monthlyReminder: true,
    });
    const savedNotificationSetting = await this.notificationSettingModel.save(
      createdNotificationSetting,
    );
    member.notificationSetting = savedNotificationSetting;

    await this.memberModel.save(member);

    // Initialize attending days for the new member
    await this.initializeMemberAttendingDays(member.id);

    const newMember = await this.memberModel.findOne({
      where: { id: member.id },
      relations: ['gym', 'subscription', 'transactions', 'attendingDays'],
    });

    const getLatestGymSubscription =
      await this.gymService.getGymActiveSubscription(gym.id);

    if (createMemberDto.sendWelcomeMessage) {
      await this.twilioService.sendWelcomeMessage(
        newMember.name,
        newMember.phone,
        newMember.phoneNumberISOCode,
        gym,
        getLatestGymSubscription.activeSubscription.ownerSubscriptionType,
      );
    }

    if (createMemberDto.sendInvoiceMessage) {
      await this.twilioService.sendPaymentConfirmationMessage({
        memberName: member.name,
        activeSubscription:
          getLatestGymSubscription.activeSubscription.ownerSubscriptionType,
        memberPhone: member.phone,
        memberPhoneISOCode: member.phoneNumberISOCode,
        gym,
        amountPaid: subscription.price.toString(),
        paymentFor: subscription.title,
        paymentDate: format(
          getLatestGymSubscription.activeSubscription.startDate,
          'dd/MM/yyyy',
        ),
      });
    }

    return await this.returnMember(newMember);
  }

  async signupMember(
    signupMemberDto: SignupMemberDto,
    deviceId: string,
    res: Response,
  ) {
    // Check if the gym allows user signup
    const gym = await this.gymModel.findOne({
      where: { id: signupMemberDto.gymId },
    });

    if (!gym) {
      throw new NotFoundException('Gym not found');
    }

    if (!gym.allowUserSignUp) {
      throw new BadRequestException('This gym does not allow public signups');
    }

    // Check if member already exists with this phone number in this gym
    const existingMember = await this.memberModel.findOne({
      where: {
        phone: signupMemberDto.phoneNumber,
        gym: { id: signupMemberDto.gymId },
      },
    });

    if (existingMember) {
      throw new BadRequestException(
        'A member with this phone number already exists in this gym',
      );
    }

    // Create member without subscription (subscription will be added later by admin)
    const member = this.memberModel.create({
      name: signupMemberDto.name,
      email: signupMemberDto.email,
      phone: signupMemberDto.phoneNumber,
      phoneNumberISOCode: signupMemberDto.phoneNumberISOCode,
      gym: { id: signupMemberDto.gymId },
      password: signupMemberDto.password
        ? await MemberEntity.hashPassword(signupMemberDto.password)
        : null,
    });

    const savedMember = await this.memberModel.save(member);

    // Generate tokens if password is provided
    if (signupMemberDto.password) {
      const token = await this.tokenService.generateTokens({
        managerId: null,
        userId: savedMember.id,
        deviceId,
      });

      res.cookie(CookieNames.MemberToken, token.accessToken, cookieOptions);
      return await this.returnMember(savedMember);
    }

    const getLatestGymSubscription =
      await this.gymService.getGymActiveSubscription(gym.id);

    await this.twilioService.sendWelcomeMessage(
      savedMember.name,
      savedMember.phone,
      savedMember.phoneNumberISOCode,
      gym,
      getLatestGymSubscription.activeSubscription.ownerSubscriptionType,
    );

    // Return member without token if no password (they'll need to set it later)
    return {
      id: savedMember.id,
      name: savedMember.name,
      phone: savedMember.phone,
      email: savedMember.email,
      message: 'Account created successfully. Please set a password to login.',
      hasPassword: false,
    };
  }

  async loginMember(
    loginMemberDto: LoginMemberDto,
    deviceId: string,
    res: Response,
  ): Promise<ReturnUserDto | { hasPassword: boolean; message: string }> {
    const member = await this.memberModel.findOne({
      where: {
        phone: loginMemberDto.phoneNumber,
        phoneNumberISOCode: loginMemberDto.phoneNumberISOCode,
        gym: {
          ...(isUUID(loginMemberDto.gymId)
            ? { id: loginMemberDto.gymId }
            : { gymDashedName: loginMemberDto.gymId }),
        },
      },
      relations: ['gym', 'subscription', 'transactions', 'attendingDays'],
    });

    if (!member) {
      throw new BadRequestException('Invalid phone number');
    }

    // If no password provided, return password status
    if (!loginMemberDto.password) {
      return {
        hasPassword: !!member.password,
        message: member.password
          ? 'Please enter your password'
          : 'Please set a password for your account',
      };
    }

    // If member doesn't have password, set it and login
    if (!member.password) {
      member.password = await MemberEntity.hashPassword(
        loginMemberDto.password,
      );
      await this.memberModel.save(member);

      const token = await this.tokenService.generateTokens({
        managerId: null,
        userId: member.id,
        deviceId,
      });

      res.cookie(CookieNames.MemberToken, token.accessToken, cookieOptions);
      return await this.returnMember(member);
    }

    // If member has password, validate it
    if (member.password) {
      const isPasswordMatch = await MemberEntity.isPasswordMatch(
        loginMemberDto.password,
        member.password,
      );
      if (!isPasswordMatch) {
        throw new BadRequestException('Invalid password');
      }

      const token = await this.tokenService.generateTokens({
        managerId: null,
        userId: member.id,
        deviceId,
      });

      res.cookie(CookieNames.MemberToken, token.accessToken, cookieOptions);
      return await this.returnMember(member);
    }
  }

  async findAll(
    manager: ManagerEntity,
    search: string,
    limit: number,
    page: number,
    gymId: string,
    expiringInDays?: number,
  ) {
    const checkGym = await this.gymModel.findOne({
      where: { id: gymId },
    });
    if (!checkGym) {
      throw new NotFoundException('Gym not found');
    }

    let queryBuilder = this.memberModel
      .createQueryBuilder('member')
      .leftJoinAndSelect('member.gym', 'gym')
      .leftJoinAndSelect('member.subscription', 'subscription')
      .leftJoinAndSelect('member.transactions', 'transactions')
      .leftJoinAndSelect('member.profileImage', 'profileImage')
      .leftJoinAndSelect('member.attendingDays', 'attendingDays')
      .leftJoinAndSelect('member.notificationSetting', 'notificationSetting')
      .where('gym.id = :gymId', { gymId: checkGym.id });

    // Add search filter
    if (search) {
      queryBuilder.andWhere(
        '(member.name ILIKE :search OR member.phone ILIKE :search OR member.email ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    // Add expiration filter
    if (expiringInDays !== undefined) {
      console.log('this is the expiring in days', expiringInDays);
      const today = new Date();
      const todayStr = format(startOfDay(today), 'yyyy-MM-dd');
      const endDate = addDays(today, expiringInDays);
      const endDateStr = format(endOfDay(endDate), 'yyyy-MM-dd');

      queryBuilder
        .andWhere('transactions.type = :transactionType', {
          transactionType: 'subscription',
        })
        .andWhere('transactions.isInvalidated = :isInvalidated', {
          isInvalidated: false,
        })
        .andWhere('DATE(transactions.endDate) >= :todayDate', {
          todayDate: todayStr,
        })
        .andWhere('DATE(transactions.endDate) <= :endDate', {
          endDate: endDateStr,
        });
    }

    // Add ordering
    queryBuilder.orderBy('member.createdAt', 'DESC');

    // Get total count
    const totalItems = await queryBuilder.getCount();

    // Add pagination
    const offset = (page - 1) * limit;
    queryBuilder.skip(offset).take(limit);

    const members = await queryBuilder.getMany();

    const res = {
      data: members,
      meta: {
        itemsPerPage: limit,
        totalItems,
        currentPage: page,
        totalPages: Math.ceil(totalItems / limit),
      },
    };

    const items = await Promise.all(
      res.data.map(async (m: any) => this.returnMember(m)),
    );

    return {
      ...res,
      data: items,
    };
  }

  async sendWelcomeMessageToAllMembers(gymId: string) {
    const members = await this.memberModel.find({
      where: { gym: { id: gymId }, isWelcomeMessageSent: false },
      relations: ['gym'],
    });

    const getLatestGymSubscription =
      await this.gymService.getGymActiveSubscription(gymId);

    for (const member of members) {
      if (!member.gym) {
        throw new NotFoundException('Gym not found');
      }

      await this.twilioService.sendWelcomeMessage(
        member.name,
        member.phone,
        member.phoneNumberISOCode,
        member.gym,
        getLatestGymSubscription.activeSubscription.ownerSubscriptionType,
      );
    }
  }

  async findOne(id: string, gymId: string) {
    if (!isUUID(id)) {
      throw new BadRequestException('Invalid member id');
    }
    const checkGym = await this.gymModel.findOne({
      where: { id: gymId },
    });
    if (!checkGym) {
      throw new NotFoundException('Gym not found');
    }
    let member = await this.memberModel.findOne({
      where: { id, gym: { id: checkGym.id } },
      relations: {
        gym: true,
        subscription: true,
        transactions: {
          subscription: true,
        },
        profileImage: true,
        attendingDays: true,
      },
    });

    if (!member) {
      throw new NotFoundException('Member not found');
    }

    member.transactions = member.transactions
      .filter((t) => t.type === TransactionType.SUBSCRIPTION)
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );

    return await this.returnMember(member);
  }

  async renewSubscription(
    id: string,
    subscriptionId: string,
    gymId: string,
    giveFullDay?: boolean,
    willPayLater?: boolean,
    startDate?: string,
    endDate?: string,
    paidAmount?: number,
  ) {
    const checkGym = await this.gymModel.findOne({
      where: { id: gymId },
    });
    if (!checkGym) {
      throw new NotFoundException('Gym not found');
    }
    if (!isUUID(id)) {
      throw new BadRequestException('Invalid member id');
    }

    const member = await this.memberModel.findOne({
      where: { id, gym: { id: checkGym.id } },
      relations: {
        gym: true,
        subscription: true,
        transactions: true,
      },
    });
    if (!member) {
      throw new NotFoundException('Member not found');
    }

    // Reset birthday handled on renewal
    member.isBirthdayHandled = false;
    await this.memberModel.save(member);

    let checkSubscription;

    // If subscriptionId is provided, use it; otherwise use existing subscription
    if (subscriptionId) {
      // Validate the provided subscriptionId
      if (!isUUID(subscriptionId)) {
        throw new BadRequestException('Invalid subscription id');
      }

      checkSubscription = await this.subscriptionModel.findOne({
        where: { id: subscriptionId },
        relations: {
          gym: true,
        },
      });

      if (!checkSubscription) {
        throw new NotFoundException('Subscription not found');
      }

      // Verify the subscription belongs to the same gym
      if (checkSubscription.gym.id !== checkGym.id) {
        throw new BadRequestException(
          'Subscription does not belong to this gym',
        );
      }

      // Update member's subscription if it's different
      member.subscription = checkSubscription.id;
      await this.memberModel.save(member);
    } else {
      // Use existing subscription logic
      if (member.transactions.length > 0) {
        const getLatestSubscriptionInstance = member.transactions.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        )[0];

        if (!getLatestSubscriptionInstance) {
          throw new NotFoundException('Subscription not found');
        }

        const getCheckSubscription = await this.subscriptionModel.findOne({
          where: { id: getLatestSubscriptionInstance.subscriptionId },
          relations: {
            gym: true,
          },
        });

        checkSubscription = getCheckSubscription;
      } else {
        checkSubscription = await this.subscriptionModel.findOne({
          where: { gym: { id: checkGym.id } },
        });

        if (!checkSubscription) {
          throw new NotFoundException('Subscription not found');
        }

        member.subscription = checkSubscription.id;
        await this.memberModel.save(member);
      }
    }

    console.log('this is the start date', startDate);
    console.log('this is the end date', endDate);

    const createSubscriptionInstance =
      await this.transactionService.createSubscriptionInstance({
        member: member,
        gym: checkGym,
        subscription: checkSubscription,
        subscriptionType: checkSubscription?.type,
        amount: checkSubscription?.price,
        giveFullDay,
        willPayLater,
        startDate,
        endDate,
        paidAmount,
      });

    member.transactions.push(createSubscriptionInstance);
    member.isNotified = false;
    // Reset reservations counters on renewal
    member.allowedReservations = checkSubscription.allowedReservations ?? 0;
    member.usedReservations = 0;

    await this.memberModel.save(member);

    const getLatestGymSubscription =
      await this.gymService.getGymActiveSubscription(checkGym.id);

    await this.twilioService.sendPaymentConfirmationMessage({
      memberName: member.name,
      memberPhone: member.phone,
      memberPhoneISOCode: member.phoneNumberISOCode,
      gym: member.gym,
      amountPaid: createSubscriptionInstance.paidAmount.toString(),
      paymentFor: checkSubscription.title,
      paymentDate: format(createSubscriptionInstance.startDate, 'dd/MM/yyyy'),
      activeSubscription:
        getLatestGymSubscription.activeSubscription.ownerSubscriptionType,
    });

    return {
      message: 'Subscription renewed successfully',
    };
  }

  async addSubscriptionToMember({
    memberId,
    gymId,
    subscriptionId,
    endDate,
    giveFullDay,
    willPayLater,
    startDate,
    paidAmount,
    forFree,
    isBirthdaySubscription,
  }: {
    memberId: string;
    subscriptionId: string;
    gymId: string;
    giveFullDay?: boolean;
    willPayLater?: boolean;
    startDate?: string;
    endDate?: string;
    paidAmount?: number;
    forFree?: boolean;
    isBirthdaySubscription?: boolean;
  }) {
    const checkGym = await this.gymModel.findOne({
      where: { id: gymId },
    });
    if (!checkGym) {
      throw new NotFoundException('Gym not found');
    }
    const getSubscription = await this.subscriptionModel.findOne({
      where: { id: subscriptionId, gym: { id: gymId } },
    });
    if (!getSubscription) {
      throw new NotFoundException('Subscription not found');
    }
    const member = await this.memberModel.findOne({
      where: { id: memberId, gym: { id: gymId } },
    });
    if (!member) {
      throw new NotFoundException('Member not found');
    }
    console.log('this is the member', member);
    // Reset birthday handled when adding a new subscription instance
    member.isBirthdayHandled = false;
    member.subscription = getSubscription;
    // Reset reservations counters when adding a new subscription instance
    member.allowedReservations = getSubscription.allowedReservations ?? 0;
    member.usedReservations = 0;
    await this.memberModel.save(member);

    console.log('forFree', forFree);
    console.log('paidAmount', paidAmount);
    await this.transactionService.createSubscriptionInstance({
      member: member,
      gym: checkGym,
      subscription: getSubscription,
      subscriptionType: getSubscription?.type,
      amount: getSubscription?.price,
      giveFullDay,
      willPayLater,
      startDate,
      endDate,
      paidAmount,
      forFree,
      isBirthdaySubscription,
    });
    return {
      message: 'Subscription added to member successfully',
    };
  }

  async update(id: string, updateMemberDto: UpdateMemberDto, gymId: string) {
    if (!isUUID(id)) {
      throw new BadRequestException('Invalid member id');
    }
    if (!isUUID(gymId)) {
      throw new BadRequestException('Invalid gym id');
    }
    const checkGym = await this.gymModel.findOne({
      where: { id: gymId },
    });
    if (!checkGym) {
      throw new NotFoundException('Gym not found');
    }
    const member = await this.memberModel.findOne({
      where: { id, gym: { id: checkGym.id } },
      relations: [
        'gym',
        'subscription',
        'transactions',
        'profileImage',
        'attendingDays',
      ],
    });
    if (!member) {
      throw new NotFoundException('Member not found');
    }

    member.name = updateMemberDto.name;
    member.email = updateMemberDto.email;
    member.phone = updateMemberDto.phoneNumber;
    member.phoneNumberISOCode = updateMemberDto.phoneNumberISOCode;
    await this.memberModel.save(member);
    return await this.returnMember(member);
  }

  async remove(id: string, gymId: string, deleteTransactions: boolean = false) {
    if (!isUUID(id)) {
      throw new BadRequestException('Invalid member id');
    }
    const checkGym = await this.gymModel.findOne({
      where: { id: gymId },
    });
    if (!checkGym) {
      throw new NotFoundException('Gym not found');
    }
    const member = await this.memberModel.findOne({
      where: { id, gym: { id: checkGym.id } },
      relations: { transactions: true, userPtSessions: true, tokens: true },
    });

    if (!member) {
      throw new NotFoundException('Member not found');
    }

    // If deleteTransactions is true, delete all related transactions
    if (
      deleteTransactions &&
      member.transactions &&
      member.transactions.length > 0
    ) {
      // Delete all subscription instances for this member
      await this.transactionModel.delete({
        id: In(member.transactions.map((t) => t.id)),
      });
    }

    if (member.userPtSessions && member.userPtSessions.length > 0) {
      await this.personalTrainersService.removeClientFromTrainer(id, gymId);
    }

    if (member.tokens && member.tokens.length > 0) {
      await this.tokenService.deleteTokensByUserId(id);
    }

    await this.memberModel.delete(id);

    return {
      message: `Member deleted successfully${deleteTransactions ? ' along with all related transactions' : ''}`,
    };
  }

  async getExpiredMembers(
    manager: ManagerEntity,
    limit: number,
    page: number,
    search: string,
    gymId: string,
    onlyNotNotified: boolean = false,
  ) {
    const gym = await this.gymModel.findOne({
      where: { id: gymId },
    });

    if (!gym) {
      throw new NotFoundException('Gym not found');
    }

    // First get all members to check expiration
    const allMembers = await this.memberModel.find({
      where: {
        gym: { id: gym.id },
        transactions: {
          type: TransactionType.SUBSCRIPTION,
        },
        isNotified: onlyNotNotified ? false : undefined,
      },
      relations: ['gym', 'subscription', 'transactions', 'attendingDays'],
    });

    // Filter expired members
    const expiredMemberIds = allMembers
      .filter((member) => {
        const latestSubscriptionInstance = member.transactions.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        )[0];
        return (
          isBefore(new Date(latestSubscriptionInstance.endDate), new Date()) ||
          latestSubscriptionInstance.isInvalidated
        );
      })
      .map((member) => member.id);

    // Use pagination utility with the filtered IDs
    const res = await paginate(
      {
        limit,
        page,
        search,
        path: 'phone',
      },
      this.memberModel,
      {
        relations: ['gym', 'subscription', 'transactions', 'attendingDays'],
        sortableColumns: ['createdAt', 'updatedAt', 'name', 'phone'],
        searchableColumns: ['name', 'phone', 'email'],
        defaultSortBy: [['createdAt', 'DESC']],
        where: { id: In(expiredMemberIds) },
        filterableColumns: {
          name: [FilterOperator.ILIKE],
          phone: [FilterOperator.ILIKE],
          email: [FilterOperator.ILIKE],
        },

        maxLimit: 100,
      },
    );

    const items = await Promise.all(
      res.data.map(async (m: any) => this.returnMember(m)),
    );

    return {
      ...res,
      data: items,
    };
  }

  async getMe(id: string) {
    const checkMember = await this.memberModel.findOne({
      where: { id },
      relations: [
        'gym',
        'subscription',
        'transactions',
        'attendingDays',
        'trainingPrograms',
      ],
    });

    return await this.returnMember(checkMember);
  }

  async getMyPtSessions(member: MemberEntity, gymId: string) {
    const sessions = await this.ptSessionRepository.find({
      where: {
        gym: {
          ...(isUUID(gymId) ? { id: gymId } : { gymDashedName: gymId }),
        },
        members: { id: member.id },
      },
      relations: { members: true, personalTrainer: true, gym: true },
      order: { sessionDate: 'ASC' },
    });
    return sessions;
  }

  async getMember(id: string) {
    if (!isUUID(id)) {
      throw new BadRequestException('Invalid member id');
    }
    const checkMember = await this.memberModel.findOne({
      where: { id },
      relations: ['gym', 'subscription', 'transactions', 'attendingDays'],
    });
    if (!checkMember) {
      throw new NotFoundException('Member not found');
    }
    return await this.returnMember(checkMember);
  }

  async getMemberByIdAndGym(id: string, gymId: string) {
    if (!isUUID(gymId)) {
      throw new BadRequestException('Invalid gym id');
    }

    const checkGym = await this.gymModel.findOne({
      where: { id: gymId },
    });
    if (!checkGym) {
      throw new NotFoundException('Gym not found');
    }
    const member = await this.memberModel.findOne({
      where: { id, gym: { id: checkGym.id } },
      relations: {
        gym: true,
        subscription: true,
        transactions: true,
        attendingDays: true,
        notificationSetting: true,
      },
    });
    if (!member) {
      throw new NotFoundException('Member not found');
    }
    return await this.returnMember(member);
  }

  async checkUserSubscriptionExpired(id: string) {
    const member = await this.memberModel.findOne({
      where: { id },
      relations: ['gym', 'subscription', 'transactions', 'attendingDays'],
    });
    if (!member) {
      throw new NotFoundException('Member not found');
    }
    const latestSubscriptionInstance = member.transactions.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )[0];
    if (
      new Date(latestSubscriptionInstance.endDate) < new Date() ||
      latestSubscriptionInstance.isInvalidated
    ) {
      return true;
    }
    return false;
  }

  async toggleNotified(id: string, isNotified: boolean) {
    const member = await this.memberModel.findOne({
      where: { id },
    });
    if (!member) {
      throw new NotFoundException('Member not found');
    }
    member.isNotified = isNotified;
    await this.memberModel.save(member);
  }

  async logout(member: MemberEntity, deviceId: string) {
    await this.tokenService.deleteTokensByUserId(member.id, deviceId);
  }

  async increaseMemberAllowedReservations(
    memberId: string,
    gymId: string,
    amount: number,
  ) {
    const checkGym = await this.gymModel.findOne({ where: { id: gymId } });
    if (!checkGym) {
      throw new NotFoundException('Gym not found');
    }
    if (!isUUID(memberId)) {
      throw new BadRequestException('Invalid member id');
    }
    if (!Number.isInteger(amount) || amount <= 0) {
      throw new BadRequestException('Amount must be a positive integer');
    }

    const member = await this.memberModel.findOne({
      where: { id: memberId, gym: { id: checkGym.id } },
    });
    if (!member) {
      throw new NotFoundException('Member not found');
    }

    if (
      member.allowedReservations === null ||
      member.allowedReservations === undefined
    ) {
      member.allowedReservations = amount;
    } else {
      member.allowedReservations += amount;
    }

    await this.memberModel.save(member);
    return {
      message: 'Member reservations allowance increased successfully',
      allowedReservations: member.allowedReservations,
      usedReservations: member.usedReservations,
    };
  }

  async invalidateMemberSubscription(
    id: string,
    gymId: string,
    transactionId: string,
  ) {
    console.log('invalidateMemberSubscription', id, gymId, transactionId);
    const checkGym = await this.gymModel.findOne({
      where: { id: gymId },
    });
    if (!checkGym) {
      throw new NotFoundException('Gym not found');
    }
    const member = await this.memberModel.findOne({
      where: { id, gym: { id: checkGym.id } },
    });
    if (!member) {
      throw new NotFoundException('Member not found');
    }
    await this.transactionService.invalidateSubscriptionInstance(
      member.id,
      transactionId,
    );
    await this.memberModel.save(member);
    return { message: 'Member subscription invalidated successfully' };
  }

  async fixMemberUsernamesAndPasscodes() {
    const members = await this.memberModel.find();
    for (const member of members) {
      const checkIfPhoneExists = await this.memberModel.exists({
        where: { phone: member.phone },
      });
      if (checkIfPhoneExists) {
        member.phone = member.phone.replace('+961', '');
        await this.memberModel.save(member);
      }
    }
  }

  async updateProfileImage(
    id: string,
    image: Express.Multer.File,
    manager: ManagerEntity,
    gymId: string,
  ) {
    const checkGym = await this.gymModel.findOne({
      where: { id: gymId },
    });
    if (!checkGym) {
      throw new NotFoundException('Gym not found');
    }
    const member = await this.memberModel.findOne({
      where: { id, gym: { id: checkGym.id } },
    });
    if (!member) {
      throw new NotFoundException('Member not found');
    }
    if (image) {
      if (member.profileImage) {
        await this.mediaService.delete(member.profileImage.id);
      }
      const imageData = await this.mediaService.upload(image, manager.id);
      member.profileImage = imageData;
      await this.memberModel.save(member);
    } else {
      if (member.profileImage) {
        await this.mediaService.delete(member.profileImage.id);
      }
      member.profileImage = null;
      await this.memberModel.save(member);
    }
    return { message: 'Profile image updated successfully' };
  }

  async fixGymPhoneNumbers() {
    const members = await this.memberModel.find();
    for (const member of members) {
      // if phone number does not start with +961, add it
      if (!member.phone.startsWith('+961')) {
        member.phone = `+961${member.phone}`;
        await this.memberModel.save(member);
      }
    }
  }

  async resetMemberPassword(id: string, gymId: string) {
    const checkGym = await this.gymModel.findOne({
      where: { id: gymId },
    });
    if (!checkGym) {
      throw new NotFoundException('Gym not found');
    }

    const member = await this.memberModel.findOne({
      where: { id, gym: { id: checkGym.id } },
    });

    if (!member) {
      throw new NotFoundException('Member not found');
    }

    // Remove password from member
    member.password = null;
    await this.memberModel.save(member);

    // Log out from all devices by deleting all tokens for this user
    await this.tokenService.deleteTokensByUserId(member.id);

    return {
      message:
        'Password reset successfully. Member logged out from all devices.',
    };
  }

  async bulkDeleteMembers(
    memberIds: string[],
    gymId: string,
    deleteTransactions: boolean = false,
  ) {
    const checkGym = await this.gymModel.findOne({
      where: { id: gymId },
    });
    if (!checkGym) {
      throw new NotFoundException('Gym not found');
    }

    // Validate all member IDs are valid MongoDB ObjectIds
    for (const id of memberIds) {
      if (!isUUID(id)) {
        throw new BadRequestException(`Invalid member id: ${id}`);
      }
    }

    // Check if all members belong to this gym
    const members = await this.memberModel.find({
      where: { id: In(memberIds), gym: { id: checkGym.id } },
      relations: ['transactions'],
    });

    if (members.length !== memberIds.length) {
      throw new BadRequestException(
        'Some members do not belong to this gym or do not exist',
      );
    }

    let deletedCount = 0;
    const errors: string[] = [];

    // Delete each member
    for (const member of members) {
      await this.remove(member.id, gymId, deleteTransactions);
      deletedCount++;
    }

    return {
      message: `Successfully deleted ${deletedCount} members${deleteTransactions ? ' along with all related transactions' : ''}`,
      deletedCount,
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  async bulkNotifyMembers(memberIds: string[], gymId: string) {
    const checkGym = await this.gymModel.findOne({
      where: { id: gymId },
    });
    if (!checkGym) {
      throw new NotFoundException('Gym not found');
    }

    // Validate all member IDs are valid MongoDB ObjectIds
    for (const id of memberIds) {
      if (!isUUID(id)) {
        throw new BadRequestException(`Invalid member id: ${id}`);
      }
    }

    // Check if all members belong to this gym
    const members = await this.memberModel.find({
      where: { id: In(memberIds), gym: { id: checkGym.id } },
      relations: ['gym'],
    });

    if (members.length !== memberIds.length) {
      throw new BadRequestException(
        'Some members do not belong to this gym or do not exist',
      );
    }

    let notifiedCount = 0;
    const errors: string[] = [];

    // Notify each member
    for (const member of members) {
      const getLatestGymSubscription =
        await this.gymService.getGymActiveSubscription(member.gym.id);
      await this.twilioService.notifySingleMember({
        userId: member.id,
        gymId: checkGym.id,
        dontCheckExpired: true,
        activeSubscription:
          getLatestGymSubscription.activeSubscription.ownerSubscriptionType,
        memberPhoneISOCode: member.phoneNumberISOCode,
      });
    }

    return {
      message: `Successfully notified ${notifiedCount} members`,
      notifiedCount,
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  async notifyMembersWithExpiringSubscriptions() {
    const expiringMembers = await this.getMembersWithExpiringSubscriptions({
      days: 3,
      isNotified: false,
      ignoreMemberWhereGymDisabledMonthlyReminder: true,
    });
    console.log(
      'expiringMembers',
      expiringMembers.map((m) => {
        return { id: m.member.id, name: m.member.name };
      }),
    );
    for (const member of expiringMembers) {
      const getLatestGymSubscription =
        await this.gymService.getGymActiveSubscription(member.gym.id);
      await this.twilioService.notifySingleMember({
        userId: member.member.id,
        gymId: member.gym.id,
        memberPhoneISOCode: member.member.phoneNumberISOCode,
        activeSubscription:
          getLatestGymSubscription.activeSubscription.ownerSubscriptionType,
        dontCheckExpired: true,
      });
    }

    return {
      message: `Successfully notified ${expiringMembers.length} members`,
    };
  }
  async notifyMembersWithExpiringSubscriptionsReminder() {
    const getAllGyms = await this.gymModel.find();
    for (const gym of getAllGyms) {
      const getLatestGymSubscription =
        await this.gymService.getGymActiveSubscription(gym.id);
      const getExpiredMembers = await this.getExpiredMembers(
        null,
        1000,
        1,
        '',
        gym.id,
        true,
      );
      console.log(
        'getExpiredMembers',
        getExpiredMembers.data.map((m) => {
          return { id: m.id, name: m.name, gymName: m.gym.name };
        }),
      );
      for (const member of getExpiredMembers.data) {
        await this.twilioService.notifyMemberExpiredReminder({
          userId: member.id,
          gymId: member.gym.id,
          memberPhoneISOCode: member.phoneNumberISOCode,
          activeSubscription:
            getLatestGymSubscription.activeSubscription.ownerSubscriptionType,
        });
      }
    }
  }
  // Attending Days Methods
  async getMemberAttendingDays(memberId: string, gymId: string) {
    if (!isUUID(memberId)) {
      throw new BadRequestException('Invalid member id');
    }
    if (!isUUID(gymId)) {
      throw new BadRequestException('Invalid gym id');
    }

    const checkGym = await this.gymModel.findOne({
      where: { id: gymId },
    });
    if (!checkGym) {
      throw new NotFoundException('Gym not found');
    }

    const member = await this.memberModel.findOne({
      where: { id: memberId, gym: { id: checkGym.id } },
    });
    if (!member) {
      throw new NotFoundException('Member not found');
    }

    const attendingDays = await this.attendingDaysModel.find({
      where: { member: { id: memberId } },
      order: { dayOfWeek: 'ASC' },
    });

    return attendingDays;
  }

  async updateMemberAttendingDays(
    memberId: string,
    gymId: string,
    updateAttendingDaysDto: UpdateAttendingDaysDto,
  ) {
    if (!isUUID(memberId)) {
      throw new BadRequestException('Invalid member id');
    }
    if (!isUUID(gymId)) {
      throw new BadRequestException('Invalid gym id');
    }

    const checkGym = await this.gymModel.findOne({
      where: { id: gymId },
    });
    if (!checkGym) {
      throw new NotFoundException('Gym not found');
    }

    const member = await this.memberModel.findOne({
      where: { id: memberId, gym: { id: checkGym.id } },
    });
    if (!member) {
      throw new NotFoundException('Member not found');
    }

    // Delete existing attending days
    await this.attendingDaysModel.delete({ member: { id: memberId } });

    console.log(
      'this is the update attending days dto',
      updateAttendingDaysDto,
    );

    // Create new attending days
    const attendingDays = updateAttendingDaysDto.attendingDays.map(
      (attendingDay) => {
        const newAttendingDay = new MemberAttendingDaysEntity();
        newAttendingDay.member = member;
        newAttendingDay.dayOfWeek = attendingDay.dayOfWeek;
        newAttendingDay.startTime = attendingDay.startTime || null;
        newAttendingDay.endTime = attendingDay.endTime || null;
        newAttendingDay.isActive = attendingDay.isActive !== false;
        return newAttendingDay;
      },
    );

    await this.attendingDaysModel.save(attendingDays);

    return {
      message: 'Attending days updated successfully',
      attendingDays: await this.getMemberAttendingDays(memberId, gymId),
    };
  }

  async initializeMemberAttendingDays(memberId: string) {
    const member = await this.memberModel.findOne({
      where: { id: memberId },
    });
    if (!member) {
      throw new NotFoundException('Member not found');
    }

    // Check if attending days already exist
    const existingAttendingDays = await this.attendingDaysModel.find({
      where: { member: { id: memberId } },
    });

    if (existingAttendingDays.length > 0) {
      return existingAttendingDays;
    }

    // Create default attending days for all days of the week
    const defaultAttendingDays = Object.values(DayOfWeek).map((dayOfWeek) => {
      const attendingDay = new MemberAttendingDaysEntity();
      attendingDay.member = member;
      attendingDay.dayOfWeek = dayOfWeek;
      attendingDay.startTime = null;
      attendingDay.endTime = null;
      attendingDay.isActive = false;
      return attendingDay;
    });

    await this.attendingDaysModel.save(defaultAttendingDays);

    return defaultAttendingDays;
  }

  async updateMemberTrainingPreferences(
    memberId: string,
    gymId: string,
    updateTrainingPreferencesDto: UpdateTrainingPreferencesDto,
  ) {
    if (!isUUID(memberId)) {
      throw new BadRequestException('Invalid member id');
    }
    if (!isUUID(gymId)) {
      throw new BadRequestException('Invalid gym id');
    }

    const checkGym = await this.gymModel.findOne({
      where: { id: gymId },
    });
    if (!checkGym) {
      throw new NotFoundException('Gym not found');
    }

    const member = await this.memberModel.findOne({
      where: { id: memberId, gym: { id: checkGym.id } },
    });
    if (!member) {
      throw new NotFoundException('Member not found');
    }

    // Update training preferences
    if (updateTrainingPreferencesDto.trainingLevel !== undefined) {
      member.trainingLevel = updateTrainingPreferencesDto.trainingLevel;
    }
    if (updateTrainingPreferencesDto.trainingGoals !== undefined) {
      member.trainingGoals = updateTrainingPreferencesDto.trainingGoals;
    }
    if (updateTrainingPreferencesDto.trainingPreferences !== undefined) {
      member.trainingPreferences =
        updateTrainingPreferencesDto.trainingPreferences;
    }

    await this.memberModel.save(member);

    return {
      message: 'Training preferences updated successfully',
      member: await this.returnMember(member),
    };
  }

  async getGymAttendances(gymId: string) {
    if (!isUUID(gymId)) {
      throw new BadRequestException('Invalid gym id');
    }

    const checkGym = await this.gymModel.findOne({
      where: { id: gymId },
    });
    if (!checkGym) {
      throw new NotFoundException('Gym not found');
    }

    const members = await this.memberModel.find({
      where: { gym: { id: checkGym.id } },
      relations: ['attendingDays'],
    });

    const attendances = [];
    for (const member of members) {
      if (member.attendingDays && member.attendingDays.length > 0) {
        for (const attendingDay of member.attendingDays) {
          if (attendingDay.isActive) {
            attendances.push({
              memberId: member.id,
              memberName: member.name,
              dayOfWeek: attendingDay.dayOfWeek,
              startTime: attendingDay.startTime,
              endTime: attendingDay.endTime,
              isActive: attendingDay.isActive,
            });
          }
        }
      }
    }

    return attendances;
  }

  async updateMemberHealthInformation(
    memberId: string,
    gymId: string,
    updateHealthInformationDto: UpdateHealthInformationDto,
  ) {
    // Validate member exists and belongs to the gym
    const member = await this.memberModel.findOne({
      where: { id: memberId, gym: { id: gymId } },
    });

    if (!member) {
      throw new NotFoundException(
        'Member not found or does not belong to this gym',
      );
    }

    // Calculate BMI if both weight and height are provided
    let bmi = updateHealthInformationDto.bmi;
    if (
      updateHealthInformationDto.weight &&
      updateHealthInformationDto.height
    ) {
      const heightInMeters = updateHealthInformationDto.height / 100;
      bmi =
        updateHealthInformationDto.weight / (heightInMeters * heightInMeters);
    }

    // Update the member with health information
    await this.memberModel.update(memberId, {
      ...updateHealthInformationDto,
      bmi,
      lastHealthCheck: new Date(),
    });

    return { message: 'Health information updated successfully' };
  }

  async extendMembershipDuration(
    memberId: string,
    gymId: string,
    extendMembershipDurationDto: ExtendMembershipDurationDto,
    transactionId: string,
  ) {
    // Validate member exists and belongs to the gym
    const member = await this.memberModel.findOne({
      where: { id: memberId, gym: { id: gymId } },
    });

    if (!member) {
      throw new NotFoundException(
        'Member not found or does not belong to this gym',
      );
    }

    // Find the active subscription (transaction) for this member
    const activeSubscription = await this.getActiveSubscription(memberId);

    if (!activeSubscription) {
      throw new BadRequestException(
        'Member does not have an active subscription',
      );
    }

    // Calculate new end date by adding the specified days
    const currentEndDate = new Date(
      activeSubscription.find((t) => t.id === transactionId).endDate,
    );
    const newEndDate = new Date(currentEndDate);
    newEndDate.setDate(newEndDate.getDate() + extendMembershipDurationDto.days);
    console.log('currentEndDate', currentEndDate);
    console.log('newEndDate', newEndDate);

    // Update the subscription end date
    await this.transactionModel.update(transactionId, {
      endDate: newEndDate,
    });

    return {
      message: `Membership extended by ${extendMembershipDurationDto.days} days successfully`,
      newEndDate: newEndDate.toISOString(),
      daysExtended: extendMembershipDurationDto.days,
    };
  }

  async updateMemberProgramLink(
    memberId: string,
    gymId: string,
    updateProgramLinkDto: UpdateProgramLinkDto,
  ) {
    // Validate member exists and belongs to the gym
    const member = await this.memberModel.findOne({
      where: { id: memberId, gym: { id: gymId } },
    });

    if (!member) {
      throw new NotFoundException(
        'Member not found or does not belong to this gym',
      );
    }

    // Update the member with program link
    await this.memberModel.update(memberId, {
      programLink: updateProgramLinkDto.programLink || null,
    });

    return { message: 'Program link updated successfully' };
  }

  async markWelcomeMessageSent(memberId: string, gymId: string) {
    if (!isUUID(memberId)) {
      throw new BadRequestException('Invalid member id');
    }
    if (!isUUID(gymId)) {
      throw new BadRequestException('Invalid gym id');
    }

    const checkGym = await this.gymModel.findOne({
      where: { id: gymId },
    });
    if (!checkGym) {
      throw new NotFoundException('Gym not found');
    }

    const member = await this.memberModel.findOne({
      where: { id: memberId, gym: { id: checkGym.id } },
    });
    if (!member) {
      throw new NotFoundException('Member not found');
    }

    // Update the member with welcome message sent flag
    await this.memberModel.update(memberId, {
      welcomeMessageSentManually: true,
    });

    return { message: 'Welcome message marked as sent successfully' };
  }

  async markSubscriptionReminderSent(memberId: string, gymId: string) {
    if (!isUUID(memberId)) {
      throw new BadRequestException('Invalid member id');
    }
    if (!isUUID(gymId)) {
      throw new BadRequestException('Invalid gym id');
    }

    const checkGym = await this.gymModel.findOne({
      where: { id: gymId },
    });
    if (!checkGym) {
      throw new NotFoundException('Gym not found');
    }

    const member = await this.memberModel.findOne({
      where: { id: memberId, gym: { id: checkGym.id } },
    });

    if (!member) {
      throw new NotFoundException('Member not found');
    }

    // Get active subscriptions
    const activeSubscriptions =
      await this.checkIfUserHasActiveSubscription(memberId);

    let subscriptionToUpdate = null;

    if (activeSubscriptions && activeSubscriptions.length > 0) {
      // If user has active subscription, use the first one
      subscriptionToUpdate = activeSubscriptions[0];
    } else {
      // If no active subscription, get the last subscription
      subscriptionToUpdate = await this.getLatestSubscription(memberId);
    }

    if (!subscriptionToUpdate) {
      throw new NotFoundException('No subscription found for this member');
    }

    // Update the subscription with reminder sent flag
    await this.transactionModel.update(subscriptionToUpdate.id, {
      subscriptionReminderSentManually: true,
    });

    return { message: 'Subscription reminder marked as sent successfully' };
  }
}
