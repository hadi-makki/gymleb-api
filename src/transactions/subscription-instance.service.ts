import { ForbiddenException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { addDays, addHours, endOfDay, isAfter } from 'date-fns';
import { ExpenseEntity } from 'src/expenses/expense.entity';
import { GymEntity } from 'src/gym/entities/gym.entity';
import { ManagerEntity } from 'src/manager/manager.entity';
import { MemberEntity } from 'src/member/entities/member.entity';
import { OwnerSubscriptionTypeEntity } from 'src/owner-subscriptions/owner-subscription-type.entity';
import { PTSessionEntity } from 'src/personal-trainers/entities/pt-sessions.entity';
import { ProductEntity } from 'src/products/products.entity';
import { RevenueEntity } from 'src/revenue/revenue.entity';
import {
  SubscriptionEntity,
  SubscriptionType,
} from 'src/subscription/entities/subscription.entity';
import { UserEntity } from 'src/user/user.entity';
import { In, Repository } from 'typeorm';
import { NotFoundException } from '../error/not-found-error';
import { PaymentDetails } from '../stripe/stripe.interface';
import { TransactionEntity, TransactionType } from './transaction.entity';
import { ProductsOffersEntity } from 'src/products/products-offers.entity';
import { Permissions } from 'src/decorators/roles/role.enum';
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
    @InjectRepository(TransactionEntity)
    private readonly transactionModel: Repository<TransactionEntity>,
    @InjectRepository(RevenueEntity)
    private readonly revenueModel: Repository<RevenueEntity>,
    @InjectRepository(ExpenseEntity)
    private readonly expenseModel: Repository<ExpenseEntity>,
    @InjectRepository(PTSessionEntity)
    private readonly ptSessionRepository: Repository<PTSessionEntity>,
  ) {}
  async createSubscriptionInstance(paymentDetails: PaymentDetails) {
    console.log('this is the will pay later', paymentDetails.willPayLater);
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
      isPaid: paymentDetails.willPayLater ? false : true,
      willPayLater: paymentDetails.willPayLater,
    });
    const createdTransaction = await this.transactionModel.save(newTransaction);
    return createdTransaction;
  }

  async createAiPhoneNumberTransaction(paymentDetails: PaymentDetails) {}

  async createOwnerSubscriptionAssignmentInstance(params: {
    gym: GymEntity;
    ownerSubscriptionTypeId: string;
    startDate?: string;
    endDate?: string;
  }) {
    const type = await this.ownerSubscriptionTypeRepository.findOne({
      where: { id: params.ownerSubscriptionTypeId },
    });
    if (!type) {
      throw new NotFoundException('Owner subscription type not found');
    }
    console.log('this is the gym', params.gym);
    const endDate = params.endDate
      ? new Date(params.endDate)
      : addDays(new Date(), type.durationDays);
    const trxModel = this.transactionModel.create({
      title: type.title,
      gym: params.gym,
      type: TransactionType.OWNER_SUBSCRIPTION_ASSIGNMENT,
      ownerSubscriptionType: type,
      paidAmount: type.price,
      endDate,
      isOwnerSubscriptionAssignment: true,
      startDate: params.startDate ? new Date(params.startDate) : new Date(),
      paidBy:
        params.gym.owner.firstName +
        ' ' +
        params.gym.owner.lastName +
        ' ' +
        `(${params.gym.name})`,
      owner: params.gym.owner,
    });
    const trx = await this.transactionModel.save(trxModel);

    return trx;
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
      relations: {
        gym: {
          owner: true,
        },
      },
    });
    if (!subscriptionInstance) {
      throw new NotFoundException('Subscription instance not found');
    }
    if (
      subscriptionInstance.type ===
        TransactionType.OWNER_SUBSCRIPTION_ASSIGNMENT &&
      !subscriptionInstance.gym.owner.permissions.includes(
        Permissions.SuperAdmin,
      )
    ) {
      throw new ForbiddenException(
        'You are not allowed to delete this subscription instance',
      );
    }
    const getManagerGym = await this.gymRepository.findOne({
      where: { id: gymId },
    });

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
    offer: ProductsOffersEntity;
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
      offer: dto.offer,
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
    const getTransaction = await this.transactionModel.findOne({
      where: {
        revenue: {
          id: revenueId,
        },
      },
    });

    if (!getTransaction) {
      throw new NotFoundException('revenue not found');
    }

    await this.transactionModel.remove(getTransaction);
  }

  async deletePtSessionTransaction(ptSessionId: string) {
    const getTransaction = await this.transactionModel.findOne({
      where: {
        id: ptSessionId,
      },
    });
    console.log('this is the getTransaction', getTransaction);
    if (!getTransaction) {
      throw new NotFoundException('pt session transaction not found');
    }
    await this.transactionModel.remove(getTransaction);
  }

  async removeExpenseTransaction(expenseId: string) {
    const getTransaction = await this.transactionModel.findOne({
      where: {
        expense: {
          id: expenseId,
        },
      },
    });

    if (!getTransaction) {
      throw new NotFoundException('revenue not found');
    }

    await this.transactionModel.remove(getTransaction);
  }

  async createPersonalTrainerSessionTransaction(dto: {
    personalTrainer: ManagerEntity;
    gym: GymEntity;
    member: MemberEntity;
    amount: number;
    willPayLater: boolean;
    ptSession: PTSessionEntity;
    isTakingPtSessionsCut?: boolean;
  }) {
    const gymsPTSessionPercentage = dto.gym.gymsPTSessionPercentage;
    console.log('this is the isTakingPtSessionsCut', dto.isTakingPtSessionsCut);
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
      isPaid: !dto.willPayLater,
      // Use many-to-one relation so multiple transactions can link to the same session
      relatedPtSession: dto.ptSession,
      isTakingPtSessionsCut: dto.isTakingPtSessionsCut,
    });
    const newTransaction =
      await this.transactionModel.save(newTransactionModel);
    return newTransaction;
  }

  async updateTransactionPaymentStatus(
    transactionId: string,
    manager: ManagerEntity,
    gymId: string,
    isPaid: boolean,
  ) {
    const transaction = await this.transactionModel.findOne({
      where: { id: transactionId },
      relations: { gym: true },
    });
    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    const getManagerGym = await this.gymRepository.findOne({
      where: { id: gymId },
    });
    if (!getManagerGym) {
      throw new NotFoundException('Gym not found');
    }

    transaction.isPaid = !transaction.isPaid;
    console.log(transaction.isPaid);
    console.log(transaction.willPayLater);
    await this.transactionModel.save(transaction);

    return {
      message: `Transaction payment status updated to ${isPaid ? 'paid' : 'unpaid'}`,
      transaction,
    };
  }

  async togglePtSessionTransactionsPayment(
    sessionId: string,
    gymId: string,
    isPaid: boolean,
  ) {
    const ptSession = await this.ptSessionRepository.findOne({
      where: { id: sessionId, gym: { id: gymId } },
      relations: { transactions: true },
    });
    if (!ptSession) {
      throw new NotFoundException('PT session not found');
    }

    const transactions = ptSession.transactions || [];
    for (const trx of transactions) {
      trx.isPaid = isPaid;
      await this.transactionModel.save(trx);
    }

    return {
      message: `All transactions for the session marked as ${isPaid ? 'paid' : 'unpaid'}`,
    };
  }

  async createProductsTransferTransaction(dto: {
    transferedFrom: GymEntity;
    transferedTo: GymEntity;
    product: ProductEntity;
    transferQuantity: number;
    receiveQuantity: number;
  }) {
    const newSendTransactionModel = this.transactionModel.create({
      title:
        `Transferred ${dto.transferQuantity} ${dto.product.name} From ` +
        dto.transferedFrom.name +
        ' To ' +
        dto.transferedTo.name,
      type: TransactionType.PRODUCTS_TRANSFER,
      transferedFrom: dto.transferedFrom,
      transferedTo: dto.transferedTo,
      product: dto.product,
      transferQuantity: dto.transferQuantity,
      receiveQuantity: dto.receiveQuantity,
      paidAmount: 0,
      gym: dto.transferedFrom,
    });
    const createdSendTransaction = await this.transactionModel.save(
      newSendTransactionModel,
    );
    const newReceiveTransactionModel = this.transactionModel.create({
      title:
        `Received ${dto.receiveQuantity} ${dto.product.name} From ` +
        dto.transferedFrom.name +
        ' To ' +
        dto.transferedTo.name,
      type: TransactionType.PRODUCTS_RECEIVE,
      transferedFrom: dto.transferedTo,
      transferedTo: dto.transferedFrom,
      product: dto.product,
      receiveQuantity: dto.receiveQuantity,
      paidAmount: 0,
      gym: dto.transferedTo,
    });
    const createdReceiveTransaction = await this.transactionModel.save(
      newReceiveTransactionModel,
    );
    return {
      newSendTransaction: createdSendTransaction,
      newReceiveTransaction: createdReceiveTransaction,
    };
  }

  async createProductsReturnTransaction(dto: {
    returnedFrom: GymEntity;
    returnedTo: GymEntity;
    product: ProductEntity;
    returnQuantity: number;
  }) {
    const newReturnTransactionModel = this.transactionModel.create({
      title:
        `Returned ${dto.returnQuantity} ${dto.product.name} From ` +
        dto.returnedFrom.name +
        ' To ' +
        dto.returnedTo.name,
      type: TransactionType.PRODUCTS_RETURN,
      transferedFrom: dto.returnedFrom,
      transferedTo: dto.returnedTo,
      product: dto.product,
      returnedQuantity: dto.returnQuantity,
      paidAmount: 0,
      gym: dto.returnedFrom,
    });
    const createdReturnTransaction = await this.transactionModel.save(
      newReturnTransactionModel,
    );

    const newReceiveTransactionModel = this.transactionModel.create({
      title:
        `Returned ${dto.returnQuantity} ${dto.product.name} From ` +
        dto.returnedTo.name +
        ' To ' +
        dto.returnedFrom.name,
      type: TransactionType.PRODUCTS_RETURN,
      transferedFrom: dto.returnedTo,
      transferedTo: dto.returnedFrom,
      product: dto.product,
      receiveQuantity: dto.returnQuantity,
      paidAmount: 0,
      gym: dto.returnedTo,
    });
    const createdReceiveTransaction = await this.transactionModel.save(
      newReceiveTransactionModel,
    );
    return {
      newReturnTransaction: createdReturnTransaction,
      newReceiveTransaction: createdReceiveTransaction,
    };
  }
}
