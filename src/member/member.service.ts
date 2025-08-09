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
import { TransactionsService } from '../transactions/transactions.service';
import { isMongoId, isUUID } from 'class-validator';
import { BadRequestException } from '../error/bad-request-error';
import { LoginMemberDto } from './dto/login-member.dto';
import { TokenService } from '../token/token.service';
import { ReturnUserDto, ReturnUserWithTokenDto } from './dto/return-user.dto';

@Injectable()
export class MemberService {
  constructor(
    @InjectModel(Member.name)
    private memberModel: Model<Member>,
    @InjectModel(Gym.name)
    private gymModel: Model<Gym>,
    @InjectModel(Subscription.name)
    private subscriptionModel: Model<Subscription>,
    private readonly transationService: TransactionsService,
    private readonly tokenService: TokenService,
  ) {}

  async returnMember(member: Member): Promise<ReturnUserDto> {
    const checkActiveSubscription = member.transactions?.some((transaction) => {
      return new Date(transaction.endDate) > new Date();
    });
    const currentActiveSubscription = member.transactions?.find(
      (transaction) => {
        return new Date(transaction.endDate) > new Date();
      },
    );
    return {
      id: member.id,
      name: member.name,
      email: member.email,
      phone: member.phone,
      username: member.username,
      passCode: member.passCode,
      gym: member.gym,
      subscription: member.subscription,
      transactions: member.transactions,
      createdAt: member.createdAt,
      updatedAt: member.updatedAt,
      hasActiveSubscription: checkActiveSubscription,
      currentActiveSubscription: currentActiveSubscription,
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
    const transaction = await this.transationService.createTransaction({
      memberId: member.id,
      gymId: gym.id,
      subscriptionId: subscription.id,
      subscriptionType: subscription.type,
      amount: subscription.price,
    });

    member.transactions = [transaction.id];

    await member.save();

    gym.transactions.push(transaction.id);
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
  ): Promise<ReturnUserWithTokenDto> {
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

    const token = await this.tokenService.generateTokens({
      managerId: null,
      userId: member.id,
    });

    return {
      ...(await this.returnMember(member)),
      token: token.accessToken,
    };
  }

  async findAll(manager: Manager, search: string) {
    const checkGym = await this.gymModel.findOne({
      owner: manager.id,
    });
    if (!checkGym) {
      throw new NotFoundException('Gym not found');
    }
    const getMembers = await this.memberModel
      .find({
        gym: checkGym.id,
        ...(search && { name: { $regex: search, $options: 'i' } }),
      })
      .populate('gym')
      .populate('subscription')
      .populate('transactions');

    const checkMembers = await Promise.all(
      getMembers.map(async (member) => {
        return await this.returnMember(member);
      }),
    );

    return checkMembers;
  }

  async findOne(id: string) {
    if (!isMongoId(id)) {
      throw new BadRequestException('Invalid member id');
    }
    const member = await this.memberModel
      .findById(id)
      .populate('gym')
      .populate('subscription')
      .populate('transactions');

    const checkActiveSubscription = member.transactions.some((transaction) => {
      return new Date(transaction.endDate) > new Date();
    });

    let latestTransaction;
    let checkSubscription;

    if (member.transactions.length > 0) {
      latestTransaction = member.transactions.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )[0];

      checkSubscription = await this.subscriptionModel.findOne({
        _id: latestTransaction.subscription,
      });
    } else {
      checkSubscription = await this.subscriptionModel.findOne({
        gym: member.gym.id,
      });

      if (!checkSubscription) {
        throw new NotFoundException('Subscription not found');
      }

      const transaction = await this.transationService.createTransaction({
        memberId: member.id,
        gymId: member.gym.id,
        subscriptionId: checkSubscription.id,
        subscriptionType: checkSubscription.type,
        amount: checkSubscription.price,
      });

      member.transactions = [transaction.id];
      member.subscription = checkSubscription.id;
      await member.save();

      const gym = await this.gymModel.findById(member.gym.id);

      gym.transactions.push(transaction.id);
      await gym.save();

      latestTransaction = transaction;
      checkSubscription = checkSubscription;
      const getMember = await this.memberModel
        .findById(member.id)
        .populate('transactions')
        .populate('gym')
        .populate('subscription');

      return await this.returnMember(getMember);
    }

    latestTransaction.subscription = checkSubscription;

    return await this.returnMember(member);
  }

  async renewSubscription(id: string) {
    if (!isMongoId(id)) {
      throw new BadRequestException('Invalid member id');
    }

    const member = await this.memberModel.findById(id).populate('transactions');

    if (!member) {
      throw new NotFoundException('Member not found');
    }

    const checkGym = await this.gymModel.findById(member.gym);

    if (!checkGym) {
      throw new NotFoundException('Gym not found');
    }

    let checkSubscription;

    if (member.transactions.length > 0) {
      const getLatestTransaction = member.transactions.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )[0];

      checkSubscription = await this.subscriptionModel.findById(
        getLatestTransaction.subscription,
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

    const createTransaction = await this.transationService.createTransaction({
      memberId: member.id,
      gymId: checkGym.id,
      subscriptionId: checkSubscription.id,
      subscriptionType: checkSubscription.type,
      amount: checkSubscription.price,
    });

    member.transactions.push(createTransaction.id);
    member.isNotified = false;

    await member.save();

    checkGym.transactions.push(createTransaction.id);
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

  async getExpiredMembers(manager: Manager) {
    const gym = await this.gymModel.findOne({
      owner: manager.id,
    });

    if (!gym) {
      throw new NotFoundException('Gym not found');
    }

    const getMembers = await this.memberModel
      .find({
        gym: gym.id,
      })
      .populate('transactions')
      .populate('subscription');

    const expiredMembers = await Promise.all(
      getMembers.map(async (member) => {
        const latestTransaction = member.transactions.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        )[0];

        if (new Date(latestTransaction.endDate) < new Date()) {
          return await this.returnMember(member);
        }
      }),
    );

    return expiredMembers.filter((member) => member !== undefined);
  }

  async getMe(member: Member) {
    const checkMember = await this.memberModel
      .findById(member.id)
      .populate('gym')
      .populate('subscription')
      .populate('transactions');

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
    const latestTransaction = member.transactions.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )[0];
    if (new Date(latestTransaction.endDate) < new Date()) {
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
}
