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
import { OwnerSubscription } from '../owner-subscriptions/owner-subscription.entity';
import { UnauthorizedException } from '../error/unauthorized-error';
import { Permissions } from '../decorators/roles/role.enum';
import { Transaction, TransactionType } from './transaction.entity';
import { Types } from 'mongoose';
import { Revenue } from '../revenue/revenue.entity';
import { Expense } from '../expenses/expense.entity';
@Injectable()
export class TransactionService {
  constructor(
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
    @InjectModel(Transaction.name)
    private readonly transactionModel: Model<Transaction>,
    @InjectModel(Revenue.name)
    private readonly revenueModel: Model<Revenue>,
    @InjectModel(Expense.name)
    private readonly expenseModel: Model<Expense>,
  ) {}
  async createSubscriptionInstance(paymentDetails: PaymentDetails) {
    // Use custom dates if provided, otherwise calculate based on subscription type
    let startDate = paymentDetails.startDate
      ? new Date(paymentDetails.startDate)
      : new Date();
    let endDate: Date;

    console.log('startDate', startDate);

    if (paymentDetails.endDate) {
      // Use custom end date if provided
      endDate = new Date(paymentDetails.endDate);
    } else {
      // Calculate end date based on subscription type and start date
      if (paymentDetails.subscriptionType === SubscriptionType.DAILY_GYM) {
        endDate = paymentDetails.giveFullDay
          ? addHours(startDate, 24)
          : endOfDay(startDate);
      } else {
        endDate = addDays(startDate, paymentDetails.subscription.duration);
      }
    }

    const newTransaction = await this.transactionModel.create({
      title: paymentDetails.subscription.title,
      type: TransactionType.SUBSCRIPTION,
      member: paymentDetails.member,
      gym: paymentDetails.gym,
      subscription: paymentDetails.subscription,
      endDate: endDate.toISOString(),
      paidAmount: paymentDetails.amount,
      startDate: startDate.toISOString(),
      paidBy: paymentDetails.member.name,
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
    const trx = await this.transactionModel.create({
      title: type.title,
      type: TransactionType.OWNER_SUBSCRIPTION_ASSIGNMENT,
      owner,
      ownerSubscriptionType: type,
      paidAmount: params.paidAmount,
      endDate,
      isOwnerSubscriptionAssignment: true,
      startDate: new Date().toISOString(),
      paidBy: owner.firstName + ' ' + owner.lastName,
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

    const subscriptionInstances = await this.transactionModel
      .find({
        ...(manager
          ? { isOwnerSubscriptionAssignment: true }
          : { member: member._id }),
      })
      .populate('subscription')
      .populate('gyms')
      .populate('member')
      .populate('owner')
      .populate('ownerSubscriptionType')
      .populate('product')
      .populate('revenue')
      .sort({ createdAt: -1 });

    return subscriptionInstances;
  }

  async findByIds(ids: string[]) {
    const subscriptionInstance = await this.transactionModel.find({
      _id: { $in: ids },
    });
    if (!subscriptionInstance) {
      throw new NotFoundException('Subscription instance not found');
    }
    return subscriptionInstance;
  }

  async invalidateSubscriptionInstance(memberId: string) {
    const member = await this.memberRepository
      .findById(memberId)
      .populate('transactions');
    if (!member) {
      throw new NotFoundException('Member not found');
    }
    const activeSubscriptionInstance = member.transactions.find(
      (transaction) =>
        isAfter(new Date(transaction.endDate), new Date()) &&
        !transaction.isInvalidated,
    );
    if (!activeSubscriptionInstance) {
      throw new NotFoundException('Subscription instance not found');
    }
    activeSubscriptionInstance.isInvalidated = true;
    activeSubscriptionInstance.invalidatedAt = new Date();
    await activeSubscriptionInstance.save();
    return {
      message: 'Subscription instance invalidated successfully',
    };
  }

  async deleteSubscriptionInstance(
    subscriptionId: string,
    manager: Manager,
    gymId: string,
  ) {
    const subscriptionInstance = await this.transactionModel
      .findById(subscriptionId)
      .populate('gym');
    if (!subscriptionInstance) {
      throw new NotFoundException('Subscription instance not found');
    }
    const getManagerGym = await this.gymRepository.findById(gymId);

    if (getManagerGym.owner.toString() !== manager._id.toString()) {
      throw new UnauthorizedException(
        'You do not have permission to delete this subscription instance',
      );
    }

    await this.transactionModel.deleteOne({
      _id: subscriptionInstance._id,
    });

    if (subscriptionInstance.type === TransactionType.REVENUE) {
      await this.revenueModel.deleteOne({
        _id: subscriptionInstance.revenue,
      });
    } else if (subscriptionInstance.type === TransactionType.EXPENSE) {
      await this.expenseModel.deleteOne({
        _id: subscriptionInstance.expense,
      });
    }
    return {
      message: 'Subscription instance deleted successfully',
    };
  }

  async createRevenueTransaction(dto: {
    paidAmount: number;
    gym: Gym;
    product: Product;
    numberSold: number;
    date: Date;
    revenue: Revenue;
  }) {
    const newTransaction = await this.transactionModel.create({
      title: dto.revenue.title,
      type: TransactionType.REVENUE,
      paidAmount: dto.paidAmount,
      gym: dto.gym,
      product: dto.product,
      numberSold: dto.numberSold,
      revenue: dto.revenue,
      date: dto.date,
    });
    return newTransaction;
  }

  async createExpenseTransaction(dto: {
    paidAmount: number;
    gym: Gym;
    expense: Expense;
    title: string;
    date: Date;
  }) {
    const newTransaction = await this.transactionModel.create({
      title: dto.expense.title,
      type: TransactionType.EXPENSE,
      paidAmount: dto.paidAmount,
      gym: dto.gym,
      expense: dto.expense,
      date: dto.date,
    });
    return newTransaction;
  }

  async removeRevenueTransaction(revenueId: string) {
    await this.transactionModel.deleteOne({
      revenue: new Types.ObjectId(revenueId),
      type: TransactionType.REVENUE,
    });
  }

  async removeExpenseTransaction(expenseId: string) {
    await this.transactionModel.deleteOne({
      expense: new Types.ObjectId(expenseId),
      type: TransactionType.EXPENSE,
    });
  }

  async createPersonalTrainerSessionTransaction(dto: {
    personalTrainer: Manager;
    gym: Gym;
    member: Member;
    amount: number;
  }) {
    const gymsPTSessionPercentage = dto.gym.gymsPTSessionPercentage;
    const newTransaction = await this.transactionModel.create({
      title:
        'Personal Trainer Session With ' +
        dto.personalTrainer.firstName +
        ' ' +
        dto.personalTrainer.lastName,
      type: TransactionType.PERSONAL_TRAINER_SESSION,
      personalTrainer: dto.personalTrainer,
      gym: dto.gym,
      member: dto.member,
      paidAmount: dto.amount,
      gymsPTSessionPercentage: gymsPTSessionPercentage || 0,
    });
    return newTransaction;
  }
}
