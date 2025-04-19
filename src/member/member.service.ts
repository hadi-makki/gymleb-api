import { Injectable } from '@nestjs/common';
import { CreateMemberDto } from './dto/create-member.dto';
import { UpdateMemberDto } from './dto/update-member.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Member } from './entities/member.entity';
import { Manager } from 'src/manager/manager.entity';
import { Gym } from 'src/gym/entities/gym.entity';
import { NotFoundException } from 'src/error/not-found-error';
import { Subscription } from 'src/subscription/entities/subscription.entity';
import { TransactionsService } from 'src/transactions/transactions.service';
import { isMongoId, isUUID } from 'class-validator';
import { BadRequestException } from 'src/error/bad-request-error';

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
  ) {}

  async create(createMemberDto: CreateMemberDto, manager: Manager) {
    console.log(createMemberDto.subscriptionId);
    const gym = await this.gymModel.findOne({
      owner: manager.id,
    });
    console.log('gym', gym);
    if (!gym) {
      throw new NotFoundException('Gym not found');
    }
    const subscription = await this.subscriptionModel.findOne({
      _id: createMemberDto.subscriptionId,
    });
    console.log('subscription', subscription);
    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    const member = await this.memberModel.create({
      ...createMemberDto,
      gym: gym.id,
      subscription: subscription.id,
    });
    const transaction = await this.transationService.createTransaction({
      memberId: member.id,
      gymId: gym.id,
      subscriptionId: subscription.id,
      subscriptionType: subscription.type,
    });

    member.transactions = [transaction.id];

    await member.save();

    const newMember = await this.memberModel
      .findById(member.id)
      .populate('gym')
      .populate('subscription')
      .populate('transactions');

    console.log('newMember', newMember);

    return {
      id: newMember.id,
      name: newMember.name,
      email: newMember.email,
      phone: newMember.phone,
      gym: newMember.gym,
      subscription: newMember.subscription,
      transactions: newMember.transactions,
      hasActiveSubscription: true,
    };
  }

  async findAll() {
    const getMembers = await this.memberModel
      .find()
      .populate('gym')
      .populate('subscription')
      .populate('transactions');

    const checkMembers = getMembers.map((member) => {
      const checkActiveSubscription = member.transactions.some(
        (transaction) => {
          return new Date(transaction.endDate) > new Date();
        },
      );
      const currentActiveSubscription = member.transactions.find(
        (transaction) => {
          return new Date(transaction.endDate) > new Date();
        },
      );

      return {
        id: member.id,
        name: member.name,
        email: member.email,
        phone: member.phone,
        gym: member.gym,
        subscription: member.subscription,
        transactions: member.transactions,
        createdAt: member.createdAt,
        updatedAt: member.updatedAt,
        hasActiveSubscription: checkActiveSubscription,
        currentActiveSubscription: currentActiveSubscription,
      };
    });

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
      console.log(' this is the member', member);
      checkSubscription = await this.subscriptionModel.findOne({
        gym: member.gym.id,
      });
      console.log(' this is the checkSubscription', checkSubscription);

      if (!checkSubscription) {
        throw new NotFoundException('Subscription not found');
      }

      const transaction = await this.transationService.createTransaction({
        memberId: member.id,
        gymId: member.gym.id,
        subscriptionId: checkSubscription.id,
        subscriptionType: checkSubscription.type,
      });

      member.transactions = [transaction.id];
      member.subscription = checkSubscription.id;
      await member.save();

      latestTransaction = transaction;
      checkSubscription = checkSubscription;
    }

    latestTransaction.subscription = checkSubscription;

    return {
      id: member.id,
      name: member.name,
      email: member.email,
      phone: member.phone,
      gym: member.gym,
      subscription: member.subscription,
      transactions: member.transactions,
      createdAt: member.createdAt,
      updatedAt: member.updatedAt,
      hasActiveSubscription: checkActiveSubscription,
      currentActiveSubscription: latestTransaction || null,
    };
  }

  async renewSubscription(id: string) {
    if (!isMongoId(id)) {
      throw new BadRequestException('Invalid member id');
    }

    const member = await this.memberModel.findById(id).populate('transactions');

    console.log(' this is the member', member);

    if (!member) {
      throw new NotFoundException('Member not found');
    }

    const checkGym = await this.gymModel.findById(member.gym);

    if (!checkGym) {
      throw new NotFoundException('Gym not found');
    }

    let checkSubscription;

    console.log(' this is the member', member);

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
    });

    member.transactions.push(createTransaction.id);

    await member.save();

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
}
