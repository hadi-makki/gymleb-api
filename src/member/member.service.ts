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
import { SubscriptionInstanceService } from '../transactions/subscription-instance.service';
import { isMongoId, isUUID } from 'class-validator';
import { BadRequestException } from '../error/bad-request-error';
import { LoginMemberDto } from './dto/login-member.dto';
import { TokenService } from '../token/token.service';
import { ReturnUserDto, ReturnUserWithTokenDto } from './dto/return-user.dto';
import { paginateModel } from '../utils/pagination';

@Injectable()
export class MemberService {
  constructor(
    @InjectModel(Member.name)
    private memberModel: Model<Member>,
    @InjectModel(Gym.name)
    private gymModel: Model<Gym>,
    @InjectModel(Subscription.name)
    private subscriptionModel: Model<Subscription>,
    private readonly subscriptionInstanceService: SubscriptionInstanceService,
    private readonly tokenService: TokenService,
  ) {}

  async returnMember(member: Member): Promise<ReturnUserDto> {
    if (!member) {
      throw new BadRequestException('Member data is required');
    }

    // Ensure subscriptionInstances is an array
    const subscriptionInstances = member.subscriptionInstances || [];

    const checkActiveSubscription = subscriptionInstances.some(
      (subscriptionInstance) => {
        return (
          subscriptionInstance?.endDate &&
          new Date(subscriptionInstance.endDate) > new Date()
        );
      },
    );
    const currentActiveSubscription = subscriptionInstances.find(
      (subscriptionInstance) => {
        return (
          subscriptionInstance?.endDate &&
          new Date(subscriptionInstance.endDate) > new Date()
        );
      },
    );
    const lastSubscription =
      subscriptionInstances[subscriptionInstances.length - 1];
    return {
      id: member.id,
      name: member.name,
      email: member.email,
      phone: member.phone,
      username: member.username,
      passCode: member.passCode,
      gym: member.gym,
      subscription: member.subscription,
      subscriptionInstances: member.subscriptionInstances,
      createdAt: member.createdAt,
      updatedAt: member.updatedAt,
      hasActiveSubscription: checkActiveSubscription,
      currentActiveSubscription: currentActiveSubscription,
      lastSubscription: lastSubscription,
      isNotified: member.isNotified,
    };
  }

  async create(createMemberDto: CreateMemberDto, manager: Manager) {
    const gym = await this.gymModel.findOne({
      owner: manager.id,
    });
    if (!gym) {
      throw new NotFoundException('Gym not found');
    }

    const subscription = await this.subscriptionModel.findOne({
      _id: createMemberDto.subscriptionId,
    });
    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    const checkIfNameExists = await this.memberModel.findOne({
      name: createMemberDto.name,
      gym: gym.id,
    });
    if (checkIfNameExists) {
      throw new BadRequestException('Name already exists');
    }

    const fullName = createMemberDto.name.split(' ');

    let username = fullName[0].toLowerCase();
    if (username.length === 1) {
      username = username + Math.floor(1000 + Math.random() * 9000);
    }
    if (fullName.length > 1) {
      username = username + fullName[1].toLowerCase().substring(0, 3);
    }

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
      passCode: `${createMemberDto.name.slice(0, 3).toLowerCase()}-${Math.floor(
        1000 + Math.random() * 9000,
      )}`,
    });
    const subscriptionInstance =
      await this.subscriptionInstanceService.createSubscriptionInstance({
        memberId: member.id,
        gymId: gym.id,
        subscriptionId: subscription.id,
        subscriptionType: subscription.type,
        amount: subscription.price,
        giveFullDay: createMemberDto.giveFullDay,
        startDate: createMemberDto.startDate,
        endDate: createMemberDto.endDate,
      });

    member.subscriptionInstances = [subscriptionInstance.id];

    await member.save();

    gym.subscriptionInstances.push(subscriptionInstance.id);
    await gym.save();

    const newMember = await this.memberModel
      .findById(member.id)
      .populate('gym')
      .populate('subscription')
      .populate('subscriptionInstances');

    return await this.returnMember(newMember);
  }

  async loginMember(
    loginMemberDto: LoginMemberDto,
  ): Promise<ReturnUserWithTokenDto> {
    const member = await this.memberModel
      .findOne({
        username: loginMemberDto.username,
        passCode: loginMemberDto.password,
      })
      .populate('gym')
      .populate('subscription')
      .populate('subscriptionInstances');
    if (!member) {
      throw new BadRequestException('Invalid passcode or username');
    }

    const token = await this.tokenService.generateTokens({
      managerId: null,
      userId: member.id,
    });

    return {
      ...(await this.returnMember(member)),
      token: token.accessToken,
    };
  }

  async findAll(manager: Manager, search: string, limit: number, page: number) {
    const checkGym = await this.gymModel.findOne({ owner: manager.id });
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
        { path: 'subscriptionInstances' },
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

  async findOne(id: string) {
    if (!isMongoId(id)) {
      throw new BadRequestException('Invalid member id');
    }
    const member = await this.memberModel
      .findById(id)
      .populate('gym')
      .populate('subscription')
      .populate({
        path: 'subscriptionInstances',
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
    giveFullDay?: boolean,
  ) {
    if (!isMongoId(id)) {
      throw new BadRequestException('Invalid member id');
    }

    const member = await this.memberModel
      .findById(id)
      .populate('subscriptionInstances')
      .populate('subscription');

    if (!member) {
      throw new NotFoundException('Member not found');
    }

    const checkGym = await this.gymModel.findById(member.gym);

    if (!checkGym) {
      throw new NotFoundException('Gym not found');
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
      if (member.subscriptionInstances.length > 0) {
        const getLatestSubscriptionInstance = member.subscriptionInstances.sort(
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
      await this.subscriptionInstanceService.createSubscriptionInstance({
        memberId: member.id,
        gymId: checkGym.id,
        subscriptionId: checkSubscription.id,
        subscriptionType: checkSubscription.type,
        amount: checkSubscription.price,
        giveFullDay,
      });

    member.subscriptionInstances.push(createSubscriptionInstance.id);
    member.isNotified = false;

    await member.save();

    checkGym.subscriptionInstances.push(createSubscriptionInstance.id);
    await checkGym.save();

    return {
      message: 'Subscription renewed successfully',
    };
  }

  async update(id: string, updateMemberDto: UpdateMemberDto) {
    if (!isMongoId(id)) {
      throw new BadRequestException('Invalid member id');
    }
    const member = await this.memberModel.findById(id);
    if (!member) {
      throw new NotFoundException('Member not found');
    }

    member.name = updateMemberDto.name;
    member.email = updateMemberDto.email;
    member.phone = updateMemberDto.phone;
    await member.save();
    return await this.returnMember(member);
  }

  async remove(id: string) {
    if (!isMongoId(id)) {
      throw new BadRequestException('Invalid member id');
    }
    const member = await this.memberModel.findById(id);
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
  ) {
    const gym = await this.gymModel.findOne({
      owner: manager.id,
    });

    if (!gym) {
      throw new NotFoundException('Gym not found');
    }

    // First get all members to check expiration
    const allMembers = await this.memberModel
      .find({
        gym: gym.id,
        ...(search ? { name: { $regex: search, $options: 'i' } } : {}),
      })
      .populate('subscriptionInstances')
      .populate('subscription')
      .lean();

    // Filter expired members
    const expiredMemberIds = allMembers
      .filter((member) => {
        const latestSubscriptionInstance = member.subscriptionInstances.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        )[0];
        return new Date(latestSubscriptionInstance.endDate) < new Date();
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
        { path: 'subscriptionInstances' },
      ],
      page,
      limit,
      transform: async (member) => await this.returnMember(member as Member),
    });

    return result;
  }

  async getMe(member: Member) {
    const checkMember = await this.memberModel
      .findById(member.id)
      .populate('gym')
      .populate('subscription')
      .populate('subscriptionInstances');

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
      .populate('subscriptionInstances');
    if (!checkMember) {
      throw new NotFoundException('Member not found');
    }
    return await this.returnMember(checkMember);
  }

  async getMemberByIdAndGym(id: string, manager: Manager) {
    const gym = await this.gymModel.findOne({
      owner: manager.id,
    });

    if (!gym) {
      throw new NotFoundException('Gym not found');
    }

    const member = await this.memberModel
      .findOne({
        _id: id,
        gym: gym.id,
      })
      .populate('subscriptionInstances')
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
      .populate('subscriptionInstances')
      .populate('gym')
      .populate('subscription');
    if (!member) {
      throw new NotFoundException('Member not found');
    }
    const latestSubscriptionInstance = member.subscriptionInstances.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )[0];
    if (new Date(latestSubscriptionInstance.endDate) < new Date()) {
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

  async logout(member: Member) {
    await this.tokenService.deleteTokensByUserId(member.id);
  }

  async invalidateMemberSubscription(id: string) {
    const member = await this.memberModel.findById(id);
    if (!member) {
      throw new NotFoundException('Member not found');
    }
    await this.subscriptionInstanceService.invalidateSubscriptionInstance(
      member.id,
    );
    await member.save();
  }
}
