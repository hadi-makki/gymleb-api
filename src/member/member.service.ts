import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { isUUID } from 'class-validator';
import { addDays, endOfDay, isBefore, startOfDay } from 'date-fns';
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
import { TransactionService } from '../transactions/subscription-instance.service';
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
  ) {}

  async checkIfUserHasActiveSubscription(memberId: string) {
    const activeSubscription = await this.transactionModel.findOne({
      where: {
        member: { id: memberId },
        endDate: MoreThan(new Date()),
        isInvalidated: false,
      },
      order: { endDate: 'DESC' },
    });
    return activeSubscription;
  }

  async getLatestSubscription(memberId: string) {
    const latestSubscription = await this.transactionModel.findOne({
      where: { member: { id: memberId } },
      order: { createdAt: 'DESC' },
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
  }: {
    days: number;
    isNotified?: boolean;
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
          member: { isNotified: false },
          subscription: {
            type: Not(SubscriptionType.DAILY_GYM),
            duration: Not(LessThan(15)),
          },
        },
      ],
      relations: {
        gym: true,
        member: true,
        subscription: true,
      },
    });

    const newMembers = expiringTransactions
      .filter((t) => {
        return t.member && t.member.isNotified === false;
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
    const [activeSubscription, lastSubscription, attendingDays, reservations] =
      await Promise.all([
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
      hasActiveSubscription: !!activeSubscription,
      currentActiveSubscription: activeSubscription,
      lastSubscription: lastSubscription,
      isNotified: member.isNotified,
      profileImage: member.profileImage,
      attendingDays: attendingDays,
      reservations,
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
      lastHealthCheck: member.lastHealthCheck?.toISOString(),
    };
  }

  async create(
    createMemberDto: CreateMemberDto,
    manager: ManagerEntity,
    gymId: string,
    image?: Express.Multer.File,
  ) {
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
      });

    member.transactions = [subscriptionInstance];

    await this.memberModel.save(member);

    // Initialize attending days for the new member
    await this.initializeMemberAttendingDays(member.id);

    const newMember = await this.memberModel.findOne({
      where: { id: member.id },
      relations: ['gym', 'subscription', 'transactions', 'attendingDays'],
    });

    const getLatestGymSubscription =
      await this.gymService.getGymActiveSubscription(gym.id);

    if (gym.sendWelcomeMessageAutomatically) {
      await this.twilioService.sendWelcomeMessage(
        newMember.name,
        newMember.phone,
        newMember.phoneNumberISOCode,
        gym,
        getLatestGymSubscription.activeSubscription.ownerSubscriptionType,
      );
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
  ) {
    const checkGym = await this.gymModel.findOne({
      where: { id: gymId },
    });
    if (!checkGym) {
      throw new NotFoundException('Gym not found');
    }
    const res = await paginate(
      {
        limit,
        page,
        search,
        path: 'phone',
      },
      this.memberModel,
      {
        relations: {
          gym: true,
          subscription: true,
          transactions: true,
          profileImage: true,
          attendingDays: true,
        },
        sortableColumns: ['createdAt', 'updatedAt', 'name', 'phone'],
        searchableColumns: ['name', 'phone', 'email'],
        defaultSortBy: [['createdAt', 'DESC']],
        where: { gym: { id: checkGym.id } },
        filterableColumns: {
          name: [FilterOperator.ILIKE],
          phone: [FilterOperator.ILIKE],
          email: [FilterOperator.ILIKE],
        },
        // select: ['id', 'name', 'email', 'phone', 'createdAt', 'updatedAt'],
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
      });

    member.transactions.push(createSubscriptionInstance);
    member.isNotified = false;

    await this.memberModel.save(member);

    return {
      message: 'Subscription renewed successfully',
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

    console.log('expiredMemberIds', expiredMemberIds);

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
        select: ['id', 'name', 'email', 'phone', 'createdAt', 'updatedAt'],
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

  async invalidateMemberSubscription(id: string, gymId: string) {
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
    await this.transactionService.invalidateSubscriptionInstance(member.id);
    await this.memberModel.save(member);
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
      where: { id: In(memberIds), gym: checkGym },
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
      where: { id: In(memberIds), gym: checkGym },
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
    });
    console.log('expiringMembers', expiringMembers);
    for (const member of expiringMembers) {
      const getLatestGymSubscription =
        await this.gymService.getGymActiveSubscription(member.gym.id);
      await this.twilioService.notifySingleMember({
        userId: member.member.id,
        gymId: member.gym.id,
        memberPhoneISOCode: member.member.phoneNumberISOCode,
        activeSubscription:
          getLatestGymSubscription.activeSubscription.ownerSubscriptionType,
      });
    }

    return {
      message: `Successfully notified ${expiringMembers.length} members`,
    };
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
}
