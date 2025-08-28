import { Injectable } from '@nestjs/common';
import { CreateMemberDto } from './dto/create-member.dto';
import { UpdateMemberDto } from './dto/update-member.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Member } from './entities/member.entity';
import { Manager } from '../manager/manager.entity';
import { Gym } from '../gym/entities/gym.entity';
import { NotFoundException } from '../error/not-found-error';
import { Subscription } from '../subscription/entities/subscription.entity';
import { TransactionService } from '../transactions/subscription-instance.service';
import { isMongoId, isUUID } from 'class-validator';
import { BadRequestException } from '../error/bad-request-error';
import { LoginMemberDto } from './dto/login-member.dto';
import { TokenService } from '../token/token.service';
import { ReturnUserDto, ReturnUserWithTokenDto } from './dto/return-user.dto';
import { paginateModel } from '../utils/pagination';
import { MediaService } from '../media/media.service';
import {
  Transaction,
  TransactionType,
} from '../transactions/transaction.entity';
import { Response } from 'express';
import { CookieNames, cookieOptions } from 'src/utils/constants';
import { TwilioService } from 'src/twilio/twilio.service';
import { PersonalTrainersService } from 'src/personal-trainers/personal-trainers.service';
import { addDays, startOfDay, endOfDay } from 'date-fns';
import { GymService } from 'src/gym/gym.service';

@Injectable()
export class MemberService {
  constructor(
    @InjectModel(Member.name)
    private memberModel: Model<Member>,
    @InjectModel(Gym.name)
    private gymModel: Model<Gym>,
    @InjectModel(Subscription.name)
    private subscriptionModel: Model<Subscription>,
    private readonly transactionService: TransactionService,
    private readonly tokenService: TokenService,
    private readonly mediaService: MediaService,
    @InjectModel(Transaction.name)
    private readonly transactionModel: Model<Transaction>,
    private readonly twilioService: TwilioService,
    private readonly personalTrainersService: PersonalTrainersService,
    private readonly gymService: GymService,
  ) {}

  async getActiveSubscription(memberId: string) {
    const member = await this.memberModel.findById(memberId);
    if (!member) {
      throw new NotFoundException('Member not found');
    }

    // Use database query to find active subscription
    const activeSubscription = await this.transactionModel.findOne({
      member: memberId,
      endDate: { $gt: new Date() },
      isInvalidated: { $ne: true },
    });

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
    const expiringTransactions = await this.transactionModel
      .find({
        endDate: {
          $gte: startOfTargetDate,
          $lte: endOfTargetDate,
        },
        type: TransactionType.SUBSCRIPTION,
        isInvalidated: { $ne: true },
      })
      .populate({
        path: 'member',
        populate: [
          { path: 'gym', select: '_id name gymDashedName' },
          { path: 'subscription', select: '_id name' },
          {
            path: 'transactions',
            select: '_id endDate',
            options: {
              limit: 3,
            },
          },
        ],
        select: '_id name isNotified gym subscription transactions',
      })
      .populate({ path: 'gym', select: '_id name gymDashedName' })
      .select('_id name isNotified gym subscription transactions member')
      .lean();

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

  async returnMember(member: Member): Promise<ReturnUserDto> {
    if (!member) {
      throw new BadRequestException('Member data is required');
    }

    // Ensure subscriptionInstances is an array
    const subscriptionTransactions = member.transactions || [];

    const checkActiveSubscription = subscriptionTransactions.some(
      (subscriptionInstance) => {
        return (
          subscriptionInstance?.endDate &&
          new Date(subscriptionInstance.endDate) > new Date() &&
          !subscriptionInstance.isInvalidated
        );
      },
    );
    const currentActiveSubscription = subscriptionTransactions.find(
      (subscriptionInstance) => {
        return (
          subscriptionInstance?.endDate &&
          new Date(subscriptionInstance.endDate) > new Date() &&
          !subscriptionInstance.isInvalidated
        );
      },
    );
    const lastSubscription =
      subscriptionTransactions[subscriptionTransactions.length - 1];
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
      hasActiveSubscription: checkActiveSubscription,
      currentActiveSubscription: currentActiveSubscription,
      lastSubscription: lastSubscription,
      isNotified: member.isNotified,
      profileImage: member.profileImage,
    };
  }

  async create(
    createMemberDto: CreateMemberDto,
    manager: Manager,
    gymId: string,
    image?: Express.Multer.File,
  ) {
    const gym = await this.gymModel.findById(gymId);
    if (!gym) {
      throw new NotFoundException('Gym not found');
    }

    const subscription = await this.subscriptionModel.findById(
      createMemberDto.subscriptionId,
    );

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    const checkIfNameExists = await this.memberModel.findOne({
      name: createMemberDto.name,
      gym: gym.id,
    });
    const checkIfPhoneExists = await this.memberModel.exists({
      phone: createMemberDto.phone,
    });

    const checkIfEmailExists = createMemberDto.email
      ? await this.memberModel.exists({
          email: createMemberDto.email,
          gym: gym.id,
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

    const member = await this.memberModel.create({
      name: createMemberDto.name,
      ...(createMemberDto.email && { email: createMemberDto.email }),
      phone: createMemberDto.phone,
      gym: gym.id,
      subscription: subscription.id,
    });
    // Optional image upload and assignment
    if (image) {
      const imageData = await this.mediaService.upload(image, manager.id);
      member.profileImage = imageData.id as any;
      await member.save();
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
      });

    member.transactions = [subscriptionInstance.id];

    await member.save();

    gym.transactions.push(subscriptionInstance.id);
    await gym.save();

    const newMember = await this.memberModel
      .findById(member.id)
      .populate('gym')
      .populate('subscription')
      .populate('transactions');

    await this.twilioService.sendWelcomeMessage(
      newMember.name,
      newMember.phone,
      gym,
    );

    await this.gymService.addGymMembersNotified(gym.id, 1);

    return await this.returnMember(newMember);
  }

  async loginMember(
    loginMemberDto: LoginMemberDto,
    deviceId: string,
    res: Response,
  ): Promise<ReturnUserDto | { hasPassword: boolean; message: string }> {
    const member = await this.memberModel
      .findOne({
        phone: loginMemberDto.phoneNumber,
      })
      .populate('gym')
      .populate('subscription')
      .populate('transactions');

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
      await this.memberModel.findByIdAndUpdate(member.id, {
        password: await Member.hashPassword(loginMemberDto.password),
      });

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
      const isPasswordMatch = await Member.isPasswordMatch(
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
    manager: Manager,
    search: string,
    limit: number,
    page: number,
    gymId: string,
  ) {
    const checkGym = await this.gymModel.findById(gymId);
    if (!checkGym) {
      throw new NotFoundException('Gym not found');
    }

    const result = await paginateModel(this.memberModel, {
      filter: {
        gym: checkGym.id,
        ...(search
          ? {
              $or: [
                { name: { $regex: search, $options: 'i' } },
                { phone: { $regex: search, $options: 'i' } },
              ],
            }
          : {}),
      },
      populate: [
        { path: 'gym' },
        { path: 'subscription' },
        { path: 'transactions' },
      ],
      page,
      limit,
    });

    const items = await Promise.all(
      result.items.map(async (m: any) => this.returnMember(m as Member)),
    );

    return {
      ...result,
      items,
    };
  }

  async sendWelcomeMessageToAllMembers(gymId: string) {
    const members = await this.memberModel
      .find({
        gym: gymId,
      })
      .populate('gym');

    for (const member of members) {
      if (!member.gym) {
        throw new NotFoundException('Gym not found');
      }

      await this.twilioService.sendWelcomeMessage(
        member.name,
        member.phone,
        member.gym,
      );
    }
  }

  async findOne(id: string, gymId: string) {
    if (!isMongoId(id)) {
      throw new BadRequestException('Invalid member id');
    }
    const checkGym = await this.gymModel.findById(gymId);
    if (!checkGym) {
      throw new NotFoundException('Gym not found');
    }
    const member = await this.memberModel
      .findOne({
        _id: id,
        gym: checkGym.id,
      })
      .populate('gym')
      .populate('subscription')
      .populate({
        path: 'transactions',
        populate: { path: 'subscription' },
        options: { sort: { createdAt: -1 } },
      });

    if (!member) {
      throw new NotFoundException('Member not found');
    }

    return await this.returnMember(member);
  }

  async renewSubscription(
    id: string,
    subscriptionId: string,
    gymId: string,
    giveFullDay?: boolean,
  ) {
    const checkGym = await this.gymModel.findById(gymId);
    if (!checkGym) {
      throw new NotFoundException('Gym not found');
    }
    if (!isMongoId(id)) {
      throw new BadRequestException('Invalid member id');
    }

    const member = await this.memberModel
      .findOne({
        _id: id,
        gym: checkGym.id,
      })
      .populate({
        path: 'transactions',
        populate: { path: 'subscription', select: '_id name' },
        options: { sort: { createdAt: -1 } },
      })
      .populate('subscription');

    if (!member) {
      throw new NotFoundException('Member not found');
    }

    let checkSubscription;

    // If subscriptionId is provided, use it; otherwise use existing subscription
    if (subscriptionId) {
      // Validate the provided subscriptionId
      if (!isMongoId(subscriptionId)) {
        throw new BadRequestException('Invalid subscription id');
      }

      checkSubscription = await this.subscriptionModel.findById(subscriptionId);

      if (!checkSubscription) {
        throw new NotFoundException('Subscription not found');
      }

      // Verify the subscription belongs to the same gym
      if (checkSubscription.gym.toString() !== checkGym.id.toString()) {
        throw new BadRequestException(
          'Subscription does not belong to this gym',
        );
      }

      // Update member's subscription if it's different
      member.subscription = checkSubscription.id;
      await member.save();
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

        const getCheckSubscription = await this.subscriptionModel.findById(
          getLatestSubscriptionInstance.subscription,
        );

        checkSubscription = getCheckSubscription;
      } else {
        checkSubscription = await this.subscriptionModel.findOne({
          gym: checkGym.id,
        });

        if (!checkSubscription) {
          throw new NotFoundException('Subscription not found');
        }

        member.subscription = checkSubscription.id;
        await member.save();
      }
    }

    const createSubscriptionInstance =
      await this.transactionService.createSubscriptionInstance({
        member: member,
        gym: checkGym,
        subscription: checkSubscription,
        subscriptionType: checkSubscription?.type,
        amount: checkSubscription?.price,
        giveFullDay,
      });

    member.transactions.push(createSubscriptionInstance.id);
    member.isNotified = false;

    await member.save();

    checkGym.transactions.push(createSubscriptionInstance.id);
    await checkGym.save();

    return {
      message: 'Subscription renewed successfully',
    };
  }

  async update(id: string, updateMemberDto: UpdateMemberDto, gymId: string) {
    if (!isMongoId(id)) {
      throw new BadRequestException('Invalid member id');
    }
    if (!isMongoId(gymId)) {
      throw new BadRequestException('Invalid gym id');
    }
    const checkGym = await this.gymModel.findById(gymId);
    if (!checkGym) {
      throw new NotFoundException('Gym not found');
    }
    const member = await this.memberModel.findOne({
      _id: id,
      gym: checkGym.id,
    });
    if (!member) {
      throw new NotFoundException('Member not found');
    }

    member.name = updateMemberDto.name;
    member.email = updateMemberDto.email;
    member.phone = updateMemberDto.phone;
    await member.save();
    return await this.returnMember(member);
  }

  async remove(id: string, gymId: string, deleteTransactions: boolean = false) {
    if (!isMongoId(id)) {
      throw new BadRequestException('Invalid member id');
    }
    const checkGym = await this.gymModel.findById(gymId);
    if (!checkGym) {
      throw new NotFoundException('Gym not found');
    }
    const member = await this.memberModel
      .findOne({
        _id: id,
        gym: checkGym.id,
      })
      .populate('transactions');

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
      await this.transactionModel.deleteMany({
        _id: { $in: member.transactions.map((t) => t.id) },
      });

      // Remove transaction references from gym
      checkGym.transactions = checkGym.transactions.filter(
        (transactionId) =>
          !member.transactions.some((t) => t.id === transactionId.toString()),
      );
      await checkGym.save();
    }

    if (member.sessions.length > 0) {
      await this.personalTrainersService.removeClientFromTrainer(id, gymId);
    }

    await this.memberModel.findByIdAndDelete(id);

    return {
      message: `Member deleted successfully${deleteTransactions ? ' along with all related transactions' : ''}`,
    };
  }

  async getExpiredMembers(
    manager: Manager,
    limit: number,
    page: number,
    search: string,
    gymId: string,
  ) {
    const gym = await this.gymModel.findById(gymId);

    if (!gym) {
      throw new NotFoundException('Gym not found');
    }

    // First get all members to check expiration
    const allMembers = await this.memberModel
      .find({
        gym: gym.id,
        ...(search ? { name: { $regex: search, $options: 'i' } } : {}),
      })
      .populate('transactions')
      .populate('subscription')
      .lean();

    // Filter expired members
    const expiredMemberIds = allMembers
      .filter((member) => {
        const latestSubscriptionInstance = member.transactions.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        )[0];
        return (
          new Date(latestSubscriptionInstance.endDate) < new Date() ||
          latestSubscriptionInstance.isInvalidated
        );
      })
      .map((member) => member._id);

    // Use pagination utility with the filtered IDs
    const result = await paginateModel(this.memberModel, {
      filter: {
        _id: { $in: expiredMemberIds },
        ...(search ? { name: { $regex: search, $options: 'i' } } : {}),
      },
      populate: [
        { path: 'gym' },
        { path: 'subscription' },
        { path: 'transactions' },
      ],
      page,
      limit,
      transform: async (member) => await this.returnMember(member as Member),
    });

    return result;
  }

  async getMe(id: string) {
    const checkMember = await this.memberModel
      .findById(id)
      .populate('gym')
      .populate('subscription')
      .populate('transactions');

    return await this.returnMember(checkMember);
  }

  async getMember(id: string) {
    if (!isMongoId(id)) {
      throw new BadRequestException('Invalid member id');
    }
    const checkMember = await this.memberModel
      .findById(id)
      .populate('gym')
      .populate('subscription')
      .populate('transactions');
    if (!checkMember) {
      throw new NotFoundException('Member not found');
    }
    return await this.returnMember(checkMember);
  }

  async getMemberByIdAndGym(id: string, gymId: string) {
    if (!isMongoId(gymId)) {
      throw new BadRequestException('Invalid gym id');
    }

    const member = await this.memberModel
      .findOne({
        _id: id,
        gym: gymId,
      })
      .populate('transactions')
      .populate('gym')
      .populate('subscription');
    if (!member) {
      throw new NotFoundException('Member not found');
    }
    return await this.returnMember(member);
  }

  async checkUserSubscriptionExpired(id: string) {
    const member = await this.memberModel
      .findById(id)
      .populate('transactions')
      .populate('gym')
      .populate('subscription');
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
    const member = await this.memberModel.findById(id);
    if (!member) {
      throw new NotFoundException('Member not found');
    }
    member.isNotified = isNotified;
    await member.save();
  }

  async logout(member: Member, deviceId: string) {
    await this.tokenService.deleteTokensByUserId(member.id, deviceId);
  }

  async invalidateMemberSubscription(id: string, gymId: string) {
    const checkGym = await this.gymModel.findById(gymId);
    if (!checkGym) {
      throw new NotFoundException('Gym not found');
    }
    const member = await this.memberModel.findOne({
      _id: id,
      gym: checkGym.id,
    });
    if (!member) {
      throw new NotFoundException('Member not found');
    }
    await this.transactionService.invalidateSubscriptionInstance(member.id);
    await member.save();
  }

  async fixMemberUsernamesAndPasscodes() {
    const members = await this.memberModel.find();
    for (const member of members) {
      const checkIfPhoneExists = await this.memberModel.exists({
        username: member.phone,
      });
      await member.save();
    }
  }

  async updateProfileImage(
    id: string,
    image: Express.Multer.File,
    manager: Manager,
    gymId: string,
  ) {
    const checkGym = await this.gymModel.findById(gymId);
    if (!checkGym) {
      throw new NotFoundException('Gym not found');
    }
    const member = await this.memberModel.findOne({
      _id: id,
      gym: checkGym.id,
    });
    if (!member) {
      throw new NotFoundException('Member not found');
    }
    if (image) {
      if (member.profileImage) {
        await this.mediaService.delete(member.profileImage);
      }
      const imageData = await this.mediaService.upload(image, manager.id);
      await this.memberModel.findOneAndUpdate(
        {
          _id: id,
          gym: checkGym.id,
        },
        {
          profileImage: imageData.id,
        },
      );
    } else {
      if (member.profileImage) {
        await this.mediaService.delete(member.profileImage);
      }
      await this.memberModel.findOneAndUpdate(
        {
          _id: id,
          gym: checkGym.id,
        },
        {
          profileImage: null,
        },
      );
    }
    return { message: 'Profile image updated successfully' };
  }

  async fixGymPhoneNumbers() {
    const members = await this.memberModel.find();
    for (const member of members) {
      // if phone number does not start with +961, add it
      if (!member.phone.startsWith('+961')) {
        member.phone = `+961${member.phone}`;
        await member.save();
      }
    }
  }

  async resetMemberPassword(id: string, gymId: string) {
    const checkGym = await this.gymModel.findById(gymId);
    if (!checkGym) {
      throw new NotFoundException('Gym not found');
    }

    const member = await this.memberModel.findOne({
      _id: id,
      gym: checkGym.id,
    });

    if (!member) {
      throw new NotFoundException('Member not found');
    }

    // Remove password from member
    member.password = null;
    await member.save();

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
    const checkGym = await this.gymModel.findById(gymId);
    if (!checkGym) {
      throw new NotFoundException('Gym not found');
    }

    // Validate all member IDs are valid MongoDB ObjectIds
    for (const id of memberIds) {
      if (!isMongoId(id)) {
        throw new BadRequestException(`Invalid member id: ${id}`);
      }
    }

    // Check if all members belong to this gym
    const members = await this.memberModel
      .find({
        _id: { $in: memberIds },
        gym: checkGym.id,
      })
      .populate('transactions');

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
    const checkGym = await this.gymModel.findById(gymId);
    if (!checkGym) {
      throw new NotFoundException('Gym not found');
    }

    // Validate all member IDs are valid MongoDB ObjectIds
    for (const id of memberIds) {
      if (!isMongoId(id)) {
        throw new BadRequestException(`Invalid member id: ${id}`);
      }
    }

    // Check if all members belong to this gym
    const members = await this.memberModel
      .find({
        _id: { $in: memberIds },
        gym: checkGym.id,
      })
      .populate('gym');

    if (members.length !== memberIds.length) {
      throw new BadRequestException(
        'Some members do not belong to this gym or do not exist',
      );
    }

    let notifiedCount = 0;
    const errors: string[] = [];

    // Notify each member
    for (const member of members) {
      await this.twilioService.notifySingleMember(member.id, checkGym.id);
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
    for (const member of expiringMembers) {
      console.log('reminding member', member.member.name);
      await this.twilioService.notifySingleMember(
        member.member._id.toString(),
        member.gym._id.toString(),
        true,
      );
    }

    return {
      message: `Successfully notified ${expiringMembers.length} members`,
    };
  }
}
