import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { NotFoundException } from '../error/not-found-error';
import { Product } from '../products/products.entity';
import { PaymentDetails } from '../stripe/stripe.interface';
import { User } from '../user/user.entity';
import { SubscriptionInstance } from './subscription-instance.entity';
import { Member } from '../member/entities/member.entity';
import { Gym } from '../gym/entities/gym.entity';
import { isAfter, subDays } from 'date-fns';
import {
  Subscription,
  SubscriptionType,
} from '../subscription/entities/subscription.entity';
import { addDays, addHours, endOfDay } from 'date-fns';
import { Manager } from '../manager/manager.entity';
import { OwnerSubscriptionType } from '../owner-subscriptions/owner-subscription-type.entity';
import { OwnerSubscription } from 'src/owner-subscriptions/owner-subscription.entity';
@Injectable()
export class SubscriptionInstanceService {
  constructor(
    @InjectModel(SubscriptionInstance.name)
    private readonly subscriptionInstanceRepository: Model<SubscriptionInstance>,
    @InjectModel(User.name)
    private readonly userRepository: Model<User>,
    @InjectModel(Product.name)
    private readonly productRepository: Model<Product>,
    @InjectModel(Member.name)
    private readonly memberRepository: Model<Member>,
    @InjectModel(Gym.name)
    private readonly gymRepository: Model<Gym>,
    @InjectModel(Subscription.name)
    private readonly subscriptionRepository: Model<Subscription>,
    @InjectModel(Manager.name)
    private readonly managerRepository: Model<Manager>,
    @InjectModel(OwnerSubscriptionType.name)
    private readonly ownerSubscriptionTypeRepository: Model<OwnerSubscriptionType>,
    @InjectModel(OwnerSubscription.name)
    private readonly ownerSubscriptionRepository: Model<OwnerSubscription>,
  ) {}
  async createSubscriptionInstance(paymentDetails: PaymentDetails) {
    const getMember = await this.memberRepository.findById(
      paymentDetails.memberId,
    );
    if (!getMember) {
      throw new NotFoundException('Member not found');
    }

    const getGym = await this.gymRepository.findById(paymentDetails.gymId);
    if (!getGym) {
      throw new NotFoundException('Gym not found');
    }

    const getSubscription = await this.subscriptionRepository.findById(
      paymentDetails.subscriptionId,
    );
    if (!getSubscription) {
      throw new NotFoundException('Subscription not found');
    }

    const computedEndDate =
      paymentDetails.subscriptionType === SubscriptionType.DAILY_GYM
        ? paymentDetails.giveFullDay
          ? addHours(new Date(), 24).toISOString()
          : endOfDay(new Date()).toISOString()
        : addDays(new Date(), getSubscription.duration).toISOString();

    const newTransaction = this.subscriptionInstanceRepository.create({
      member: getMember,
      gym: getGym,
      subscription: getSubscription,
      endDate: computedEndDate,
      paidAmount: paymentDetails.amount,
    });
    return newTransaction;
  }

  async createAiPhoneNumberTransaction(paymentDetails: PaymentDetails) {}

  async createOwnerSubscriptionAssignmentInstance(params: {
    ownerId: string;
    ownerSubscriptionTypeId: string;
    paidAmount: number;
    endDateIso?: string;
  }) {
    const owner = await this.managerRepository.findById(params.ownerId);
    if (!owner) {
      throw new NotFoundException('Owner not found');
    }
    const type = await this.ownerSubscriptionTypeRepository.findById(
      params.ownerSubscriptionTypeId,
    );
    if (!type) {
      throw new NotFoundException('Owner subscription type not found');
    }
    const endDate = params.endDateIso ?? undefined;
    const trx = await this.subscriptionInstanceRepository.create({
      owner,
      ownerSubscriptionType: type,
      paidAmount: params.paidAmount,
      endDate,
      isOwnerSubscriptionAssignment: true,
    });

    await this.ownerSubscriptionRepository.updateOne(
      { owner: owner._id },
      { transaction: trx._id },
    );
    return trx;
  }

  async findAllSubscriptionInstances(memberId: string) {
    let manager: Manager = null;
    const member = await this.memberRepository.findById(memberId);
    if (!member) {
      manager = await this.managerRepository.findById(memberId);
      if (!manager) {
        throw new NotFoundException('Manager not found');
      }
    }

    const subscriptionInstances = await this.subscriptionInstanceRepository
      .find({
        ...(manager
          ? { isOwnerSubscriptionAssignment: true }
          : { member: member._id }),
      })
      .populate('subscription')
      .populate('gym')
      .populate('member')
      .populate('owner')
      .populate('ownerSubscriptionType')
      .sort({ createdAt: -1 });

    return subscriptionInstances;
  }

  async findByIds(ids: string[]) {
    const subscriptionInstance = await this.subscriptionInstanceRepository.find(
      { _id: { $in: ids } },
    );
    if (!subscriptionInstance) {
      throw new NotFoundException('Subscription instance not found');
    }
    return subscriptionInstance;
  }

  async invalidateSubscriptionInstance(memberId: string) {
    const member = await this.memberRepository
      .findById(memberId)
      .populate('subscriptionInstances');
    if (!member) {
      throw new NotFoundException('Member not found');
    }
    const activeSubscriptionInstance = member.subscriptionInstances.find(
      (instance) => isAfter(new Date(instance.endDate), new Date()),
    );
    if (!activeSubscriptionInstance) {
      throw new NotFoundException('Subscription instance not found');
    }
    activeSubscriptionInstance.endDate = subDays(new Date(), 1).toISOString();
    await activeSubscriptionInstance.save();
  }

  async deleteSubscriptionInstance(subscriptionId: string) {
    const subscriptionInstance =
      await this.subscriptionInstanceRepository.findById(subscriptionId);
    if (!subscriptionInstance) {
      throw new NotFoundException('Subscription instance not found');
    }
    await this.subscriptionInstanceRepository.deleteOne({
      _id: subscriptionInstance._id,
    });
    return {
      message: 'Subscription instance deleted successfully',
    };
  }
}
