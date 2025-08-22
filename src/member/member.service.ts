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
import { Transaction } from '../transactions/transaction.entity';

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
  ) {}

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
      username: member.username,
      passCode: member.passCode,
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

    let username = createMemberDto.phone;
    const phoneNumber = username.replace(/^\+961/, '').replace(/\s+/g, '');

    username = phoneNumber.toLowerCase();

    const checkUsername = await this.memberModel.findOne({
      username: username,
    });

    if (checkUsername) {
      username =
        username.toLowerCase() + Math.floor(1000 + Math.random() * 9000);
    }

    const member = await this.memberModel.create({
      name: createMemberDto.name,
      ...(createMemberDto.email && { email: createMemberDto.email }),
      phone: createMemberDto.phone,
      gym: gym.id,
      subscription: subscription.id,
      username: username,
      passCode: `${phoneNumber}${createMemberDto.name.slice(0, 1).toLowerCase()}`,
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

    return await this.returnMember(newMember);
  }

  async loginMember(
    loginMemberDto: LoginMemberDto,
    // deviceId: string,
  ): Promise<ReturnUserDto> {
    const member = await this.memberModel
      .findOne({
        username: loginMemberDto.username,
        passCode: loginMemberDto.password,
      })
      .populate('gym')
      .populate('subscription')
      .populate('transactions');
    if (!member) {
      throw new BadRequestException('Invalid passcode or username');
    }

    // const token = await this.tokenService.generateTokens({
    //   managerId: null,
    //   userId: member.id,
    //   deviceId,
    // });

    return {
      ...(await this.returnMember(member)),
      // token: token.accessToken,
    };
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
        ...(search ? { name: { $regex: search, $options: 'i' } } : {}),
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

    console.log('member', member.profileImage);

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
      .populate('transactions')
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

      checkSubscription = await this.transactionModel.findById(subscriptionId);

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

        checkSubscription = await this.subscriptionModel.findById(
          getLatestSubscriptionInstance.subscription,
        );
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
        subscriptionType: checkSubscription.type,
        amount: checkSubscription.price,
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

  async remove(id: string, gymId: string) {
    if (!isMongoId(id)) {
      throw new BadRequestException('Invalid member id');
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

    await this.memberModel.findByIdAndDelete(id);
    return { message: 'Member deleted successfully' };
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
    console.log('expiredMemberIds', expiredMemberIds);

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
      member.username = checkIfPhoneExists
        ? `${member.phone}-${Math.floor(1000 + Math.random() * 9000)}`
        : member.phone;
      member.passCode = `${member.phone}${member.name.slice(0, 1).toLowerCase()}`;
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
      console.log('imageData', imageData);
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
}
