import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { addDays, addHours, endOfDay, isAfter } from 'date-fns';
import { Types } from 'mongoose';
import { ExpenseEntity } from 'src/expenses/expense.entity';
import { GymEntity } from 'src/gym/entities/gym.entity';
import { ManagerEntity } from 'src/manager/manager.entity';
import { MemberEntity } from 'src/member/entities/member.entity';
import { OwnerSubscriptionTypeEntity } from 'src/owner-subscriptions/owner-subscription-type.entity';
import { OwnerSubscriptionEntity } from 'src/owner-subscriptions/owner-subscription.entity';
import { ProductEntity } from 'src/products/products.entity';
import { RevenueEntity } from 'src/revenue/revenue.entity';
import { SubscriptionEntity } from 'src/subscription/entities/subscription.entity';
import { UserEntity } from 'src/user/user.entity';
import { In, Repository } from 'typeorm';
import { NotFoundException } from '../error/not-found-error';
import { UnauthorizedException } from '../error/unauthorized-error';
import { Expense } from '../expenses/expense.model';
import { Manager } from '../manager/manager.model';
import { Member } from '../member/entities/member.model';
import { Product } from '../products/products.model';
import { Revenue } from '../revenue/revenue.model';
import { PaymentDetails } from '../stripe/stripe.interface';
import { SubscriptionType } from '../subscription/entities/subscription.model';
import { TransactionEntity } from './transaction.entity';
import { TransactionType } from './transaction.model';
@Injectable()
export class TransactionService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(ProductEntity)
    private readonly productRepository: Repository<ProductEntity>,
    @InjectRepository(MemberEntity)
    private readonly memberRepository: Repository<MemberEntity>,
    @InjectRepository(GymEntity)
    private readonly gymRepository: Repository<GymEntity>,
    @InjectRepository(SubscriptionEntity)
    private readonly subscriptionRepository: Repository<SubscriptionEntity>,
    @InjectRepository(ManagerEntity)
    private readonly managerRepository: Repository<ManagerEntity>,
    @InjectRepository(OwnerSubscriptionTypeEntity)
    private readonly ownerSubscriptionTypeRepository: Repository<OwnerSubscriptionTypeEntity>,
    @InjectRepository(OwnerSubscriptionEntity)
    private readonly ownerSubscriptionRepository: Repository<OwnerSubscriptionEntity>,
    @InjectRepository(TransactionEntity)
    private readonly transactionModel: Repository<TransactionEntity>,
    @InjectRepository(RevenueEntity)
    private readonly revenueModel: Repository<RevenueEntity>,
    @InjectRepository(ExpenseEntity)
    private readonly expenseModel: Repository<ExpenseEntity>,
  ) {}
  async createSubscriptionInstance(paymentDetails: PaymentDetails) {
    // Use custom dates if provided, otherwise calculate based on subscription type
    let startDate = paymentDetails.startDate
      ? new Date(paymentDetails.startDate)
      : new Date();
    let endDate: Date;

    if (paymentDetails.endDate) {
      // Use custom end date if provided
      endDate = new Date(paymentDetails.endDate);
    } else {
      // Calculate end date based on subscription type and start date
      if (paymentDetails?.subscriptionType === SubscriptionType.DAILY_GYM) {
        endDate = paymentDetails.giveFullDay
          ? addHours(startDate, 24)
          : endOfDay(startDate);
      } else {
        endDate = addDays(startDate, paymentDetails.subscription.duration);
      }
    }

    const newTransaction = this.transactionModel.create({
      title: paymentDetails.subscription.title,
      type: TransactionType.SUBSCRIPTION,
      member: paymentDetails.member,
      gym: paymentDetails.gym,
      subscription: paymentDetails.subscription,
      endDate: endDate,
      paidAmount: paymentDetails.amount,
      startDate: startDate,
      paidBy: paymentDetails.member.name,
      willPayLater: paymentDetails.willPayLater,
    });
    const createdTransaction = await this.transactionModel.save(newTransaction);
    return createdTransaction;
  }

  async createAiPhoneNumberTransaction(paymentDetails: PaymentDetails) {}

  async createOwnerSubscriptionAssignmentInstance(params: {
    ownerId: string;
    ownerSubscriptionTypeId: string;
    paidAmount: number;
    endDateIso?: string;
  }) {
    const owner = await this.managerRepository.findOne({
      where: { id: params.ownerId },
    });
    if (!owner) {
      throw new NotFoundException('Owner not found');
    }
    const type = await this.ownerSubscriptionTypeRepository.findOne({
      where: { id: params.ownerSubscriptionTypeId },
    });
    if (!type) {
      throw new NotFoundException('Owner subscription type not found');
    }
    const endDate = params.endDateIso ?? undefined;
    const trxModel = this.transactionModel.create({
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
    const trx = await this.transactionModel.save(trxModel);
    const findTransaction = await this.transactionModel.findOne({
      where: { id: trx.id },
    });

    findTransaction.ownerSubscriptionType = type;
    findTransaction.owner = owner;
    await this.transactionModel.save(findTransaction);

    return findTransaction;
  }

  async findAllSubscriptionInstances(memberId: string) {
    let manager: ManagerEntity = null;
    const member = await this.memberRepository.findOne({
      where: { id: memberId },
    });
    if (!member) {
      manager = await this.managerRepository.findOne({
        where: { id: memberId },
      });
      if (!manager) {
        throw new NotFoundException('Manager not found');
      }
    }

    const subscriptionInstances = await this.transactionModel.find({
      ...(manager
        ? { isOwnerSubscriptionAssignment: true }
        : { member: member }),
      relations: {
        subscription: true,
        gym: true,
        member: true,
        owner: true,
        ownerSubscriptionType: true,
        product: true,
        revenue: true,
      },
      order: { createdAt: 'DESC' },
    });

    return subscriptionInstances;
  }

  async findByIds(ids: string[]) {
    const subscriptionInstance = await this.transactionModel.find({
      where: { id: In(ids) },
    });
    if (!subscriptionInstance) {
      throw new NotFoundException('Subscription instance not found');
    }
    return subscriptionInstance;
  }

  async invalidateSubscriptionInstance(memberId: string) {
    const member = await this.memberRepository.findOne({
      where: { id: memberId },
      relations: { transactions: true },
    });
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
    await this.transactionModel.save(activeSubscriptionInstance);
    return {
      message: 'Subscription instance invalidated successfully',
    };
  }

  async deleteSubscriptionInstance(
    subscriptionId: string,
    manager: ManagerEntity,
    gymId: string,
  ) {
    const subscriptionInstance = await this.transactionModel.findOne({
      where: { id: subscriptionId },
      relations: { gym: true },
    });
    if (!subscriptionInstance) {
      throw new NotFoundException('Subscription instance not found');
    }
    const getManagerGym = await this.gymRepository.findOne({
      where: { id: gymId },
    });

    if (getManagerGym.owner.toString() !== manager.id.toString()) {
      throw new UnauthorizedException(
        'You do not have permission to delete this subscription instance',
      );
    }

    await this.transactionModel.delete({
      id: subscriptionInstance.id,
    });

    if (subscriptionInstance.type === TransactionType.REVENUE) {
      await this.revenueModel.delete({
        id: subscriptionInstance.revenue.id,
      });
    } else if (subscriptionInstance.type === TransactionType.EXPENSE) {
      await this.expenseModel.delete({
        id: subscriptionInstance.expense.id,
      });
    }

    return {
      message: 'Subscription instance deleted successfully',
    };
  }

  async createRevenueTransaction(dto: {
    paidAmount: number;
    gym: GymEntity;
    product: ProductEntity;
    numberSold: number;
    date: Date;
    revenue: RevenueEntity;
  }) {
    const newTransactionModel = this.transactionModel.create({
      title: dto.revenue.title,
      type: TransactionType.REVENUE,
      paidAmount: dto.paidAmount,
      gym: dto.gym,
      product: dto.product,
      numberSold: dto.numberSold,
      revenue: dto.revenue,
      date: dto.date,
    });
    const newTransaction =
      await this.transactionModel.save(newTransactionModel);
    return newTransaction;
  }

  async createExpenseTransaction(dto: {
    paidAmount: number;
    gym: GymEntity;
    expense: ExpenseEntity;
    title: string;
    date: Date;
  }) {
    const newTransactionModel = this.transactionModel.create({
      title: dto.expense.title,
      type: TransactionType.EXPENSE,
      paidAmount: dto.paidAmount,
      gym: dto.gym,
      expense: dto.expense,
      date: dto.date,
    });
    const newTransaction =
      await this.transactionModel.save(newTransactionModel);
    return newTransaction;
  }

  async removeRevenueTransaction(revenueId: string) {
    await this.transactionModel.delete({
      revenue: { id: revenueId },
      type: TransactionType.REVENUE,
    });
  }

  async removeExpenseTransaction(expenseId: string) {
    await this.transactionModel.delete({
      expense: { id: expenseId },
      type: TransactionType.EXPENSE,
    });
  }

  async createPersonalTrainerSessionTransaction(dto: {
    personalTrainer: ManagerEntity;
    gym: GymEntity;
    member: MemberEntity;
    amount: number;
  }) {
    const gymsPTSessionPercentage = dto.gym.gymsPTSessionPercentage;
    const newTransactionModel = this.transactionModel.create({
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
    const newTransaction =
      await this.transactionModel.save(newTransactionModel);
    return newTransaction;
  }
}
