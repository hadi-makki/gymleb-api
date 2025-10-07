import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { addDays, addHours, endOfDay, isAfter, startOfDay } from 'date-fns';
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
import { Between, In, Repository } from 'typeorm';
import { paginate } from 'nestjs-paginate';
import { NotFoundException } from '../error/not-found-error';
import { PaymentDetails } from '../stripe/stripe.interface';
import {
  PaymentStatus,
  TransactionEntity,
  TransactionType,
} from './transaction.entity';
import { ProductsOffersEntity } from 'src/products/products-offers.entity';
import { Permissions } from 'src/decorators/roles/role.enum';
import { WhishTransaction } from 'src/whish-transactions/entities/whish-transaction.entity';
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
      if (
        paymentDetails?.subscriptionType === SubscriptionType.DAILY_GYM &&
        paymentDetails.subscription.duration <= 1
      ) {
        console.log('this is the daily gym subscription');
        endDate = paymentDetails.giveFullDay
          ? addHours(startDate, 24)
          : endOfDay(startDate);
      } else {
        console.log(
          'this is the duration',
          paymentDetails.subscription.duration,
        );
        endDate = addDays(startDate, paymentDetails.subscription.duration);
      }
    }

    console.log(
      'this is the member in createSubscriptionInstance',
      paymentDetails.member,
    );
    const forFree =
      paymentDetails.forFree || paymentDetails.isBirthdaySubscription;
    const newTransaction = this.transactionModel.create({
      title: paymentDetails.subscription.title,
      type: TransactionType.SUBSCRIPTION,
      member: paymentDetails.member,
      gym: paymentDetails.gym,
      subscription: paymentDetails.subscription,
      endDate: endDate,
      paidAmount: forFree
        ? 0
        : paymentDetails.paidAmount || paymentDetails.amount,
      originalAmount: forFree ? 0 : paymentDetails.amount,
      startDate: startDate,
      paidBy: paymentDetails.member.name,
      status: forFree
        ? PaymentStatus.PAID
        : paymentDetails.paidAmount < paymentDetails.amount
          ? PaymentStatus.PARTIALLY_PAID
          : paymentDetails.willPayLater
            ? PaymentStatus.UNPAID
            : PaymentStatus.PAID,
      willPayLater: paymentDetails.willPayLater,
      forFree: forFree,
      isBirthdaySubscription: paymentDetails.isBirthdaySubscription,
      paidAt: paymentDetails.willPayLater ? null : new Date(),
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
    resetNotifications: boolean;
    whishTransaction?: WhishTransaction;
  }) {
    const type = await this.ownerSubscriptionTypeRepository.findOne({
      where: { id: params.ownerSubscriptionTypeId },
    });
    if (!type) {
      throw new NotFoundException('Owner subscription type not found');
    }

    if (params.resetNotifications) {
      params.gym.membersNotified = 0;
      params.gym.welcomeMessageNotified = 0;
      await this.gymRepository.save(params.gym);
    }

    const endDate = params.endDate
      ? new Date(params.endDate)
      : addDays(
          params.startDate ? new Date(params.startDate) : new Date(),
          type.durationDays,
        );
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
      whishTransactions: [params.whishTransaction],
      paidAt: new Date(),
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

  async getTodayPaidTransactionsForGym(gymId: string) {
    const start = startOfDay(new Date());
    const end = addDays(start, 1);

    const transactions = await this.transactionModel.find({
      where: {
        gym: { id: gymId },
        paidAt: Between(start, end),
      },
      relations: {
        member: true,
        gym: true,
      },
      order: { paidAt: 'DESC' },
    });

    return transactions;
  }

  async getTodayPaidTransactionsForGymPaginated(
    gymId: string,
    page: number,
    limit: number,
  ) {
    const start = startOfDay(new Date());
    const end = addDays(start, 1);

    const res = await paginate(
      { limit, page, search: '', path: 'title' },
      this.transactionModel,
      {
        relations: ['member', 'gym'],
        sortableColumns: ['paidAt', 'createdAt', 'title'],
        defaultSortBy: [['paidAt', 'DESC']],
        where: { gym: { id: gymId }, paidAt: Between(start, end) },
      },
    );

    // Compute totals for the day (all matching rows, not just this page)
    const qb = this.transactionModel.createQueryBuilder('t');
    const totalsRaw = await qb
      .select(
        'COALESCE(SUM(CASE WHEN t.type = :expense THEN t.paidAmount ELSE 0 END), 0)',
        'expenses',
      )
      .addSelect(
        'COALESCE(SUM(CASE WHEN t.type <> :expense THEN t.paidAmount ELSE 0 END), 0)',
        'revenue',
      )
      .where('t.gymId = :gymId', { gymId })
      .andWhere('t.paidAt BETWEEN :start AND :end', { start, end })
      .setParameters({ expense: TransactionType.EXPENSE })
      .getRawOne<{ expenses: string; revenue: string }>();

    const totalExpenses = parseFloat(totalsRaw?.expenses || '0') || 0;
    const totalRevenue = parseFloat(totalsRaw?.revenue || '0') || 0;
    const netRevenue = totalRevenue - totalExpenses;

    return {
      ...res,
      totals: {
        revenue: totalRevenue,
        expenses: totalExpenses,
        net: netRevenue,
      },
    } as any;
  }

  async invalidateSubscriptionInstance(
    memberId: string,
    transactionId: string,
  ) {
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
        !transaction.isInvalidated &&
        transaction.id === transactionId,
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

  async bulkDeleteSubscriptionInstances(
    subscriptionIds: string[],
    manager: ManagerEntity,
    gymId: string,
  ) {
    if (!subscriptionIds || subscriptionIds.length === 0) {
      throw new ForbiddenException('No subscription instances provided');
    }

    // Find all subscription instances
    const subscriptionInstances = await this.transactionModel.find({
      where: { id: In(subscriptionIds) },
      relations: {
        gym: {
          owner: true,
        },
        revenue: true,
        expense: true,
      },
    });

    if (subscriptionInstances.length === 0) {
      throw new NotFoundException('No subscription instances found');
    }

    // Validate permissions for each subscription instance
    for (const subscriptionInstance of subscriptionInstances) {
      if (
        subscriptionInstance.type ===
          TransactionType.OWNER_SUBSCRIPTION_ASSIGNMENT &&
        !subscriptionInstance.gym.owner.permissions.includes(
          Permissions.SuperAdmin,
        )
      ) {
        throw new ForbiddenException(
          'You are not allowed to delete Owner Subscription Assignment',
        );
      }
    }

    const getManagerGym = await this.gymRepository.findOne({
      where: { id: gymId },
    });

    if (!getManagerGym) {
      throw new NotFoundException('Gym not found');
    }

    // Delete related revenue and expense records first
    const revenueIds = subscriptionInstances
      .filter((instance) => instance.type === TransactionType.REVENUE)
      .map((instance) => instance.revenue?.id)
      .filter(Boolean);

    const expenseIds = subscriptionInstances
      .filter((instance) => instance.type === TransactionType.EXPENSE)
      .map((instance) => instance.expense?.id)
      .filter(Boolean);

    if (revenueIds.length > 0) {
      await this.revenueModel.delete({ id: In(revenueIds) });
    }

    if (expenseIds.length > 0) {
      await this.expenseModel.delete({ id: In(expenseIds) });
    }

    // Delete the subscription instances
    await this.transactionModel.delete({ id: In(subscriptionIds) });

    return {
      message: `${subscriptionInstances.length} subscription instances deleted successfully`,
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
      paidAt: new Date(),
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
      paidAt: new Date(),
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
      status: dto.willPayLater ? PaymentStatus.UNPAID : PaymentStatus.PAID,
      // Use many-to-one relation so multiple transactions can link to the same session
      relatedPtSession: dto.ptSession,
      isTakingPtSessionsCut: dto.isTakingPtSessionsCut,
      paidAt: new Date(),
    });
    const newTransaction =
      await this.transactionModel.save(newTransactionModel);
    return newTransaction;
  }

  async updateTransactionPaymentStatus(
    transactionId: string,
    manager: ManagerEntity,
    gymId: string,
    status: PaymentStatus,
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

    console.log('this is the transaction status', transaction.status);

    transaction.status =
      transaction.status === PaymentStatus.PAID
        ? PaymentStatus.UNPAID
        : PaymentStatus.PAID;

    if (transaction.paidAmount !== transaction.originalAmount) {
      transaction.paidAmount = transaction.originalAmount;
    }
    console.log(transaction.status);
    console.log(transaction.willPayLater);
    transaction.paidAt = new Date();
    await this.transactionModel.save(transaction);

    return {
      message: `Transaction payment status updated to ${transaction.status}`,
      transaction,
    };
  }

  async toggleTransactionPaymentStatus(
    transactionId: string,
    manager: ManagerEntity,
    gymId: string,
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

    transaction.status =
      transaction.status === PaymentStatus.PAID
        ? PaymentStatus.UNPAID
        : PaymentStatus.PAID;
    if (
      typeof transaction.originalAmount === 'number' &&
      typeof transaction.paidAmount === 'number' &&
      transaction.status === PaymentStatus.PAID &&
      transaction.paidAmount !== transaction.originalAmount
    ) {
      transaction.paidAmount = transaction.originalAmount;
    }
    transaction.paidAt = new Date();
    await this.transactionModel.save(transaction);

    return {
      message: `Transaction payment status updated to ${transaction.status}`,
      transaction,
    };
  }

  async togglePtSessionTransactionsPayment(
    sessionId: string,
    gymId: string,
    status: PaymentStatus,
  ) {
    const ptSession = await this.ptSessionRepository.findOne({
      where: { id: sessionId, gym: { id: gymId } },
      relations: { transactions: true },
    });
    if (!ptSession) {
      throw new NotFoundException('PT session not found');
    }

    const transactions = ptSession.transactions || [];
    console.log('this is the transactions', transactions);
    for (const trx of transactions) {
      trx.status = status;
      console.log('this is the trx', trx);
      await this.transactionModel.save(trx);
    }

    return {
      message: `All transactions for the session marked as ${status}`,
    };
  }

  async createProductsTransferTransaction(dto: {
    transferedFrom: GymEntity;
    transferedTo: GymEntity | string;
    product: ProductEntity;
    transferQuantity: number;
    receiveQuantity: number;
  }) {
    const newSendTransactionModel = this.transactionModel.create({
      title:
        `Transferred ${dto.transferQuantity} ${dto.product.name} From ` +
        dto.transferedFrom.name +
        ' To ' +
        (typeof dto.transferedTo === 'string'
          ? dto.transferedTo
          : dto.transferedTo.name),
      type: TransactionType.PRODUCTS_TRANSFER,
      transferedFrom: dto.transferedFrom,
      transferedTo:
        typeof dto.transferedTo === 'string' ? null : dto.transferedTo,
      product: dto.product,
      transferQuantity: dto.transferQuantity,
      receiveQuantity: dto.receiveQuantity,
      paidAmount: 0,
      gym: dto.transferedFrom,
    });
    const createdSendTransaction = await this.transactionModel.save(
      newSendTransactionModel,
    );
    let createdReceiveTransaction = null;
    if (typeof dto.transferedTo !== 'string') {
      const newReceiveTransactionModel = this.transactionModel.create({
        title:
          `Received ${dto.receiveQuantity} ${dto.product.name} From ` +
          dto.transferedFrom.name +
          ' To ' +
          (typeof dto.transferedTo === 'string'
            ? dto.transferedTo
            : dto.transferedTo.name),
        type: TransactionType.PRODUCTS_RECEIVE,
        transferedFrom: dto.transferedFrom,
        transferedTo:
          typeof dto.transferedTo === 'string' ? null : dto.transferedTo,
        product: dto.product,
        receiveQuantity: dto.receiveQuantity,
        paidAmount: 0,
        gym:
          typeof dto.transferedTo === 'string'
            ? dto.transferedFrom
            : dto.transferedTo,
      });
      createdReceiveTransaction = await this.transactionModel.save(
        newReceiveTransactionModel,
      );
    }
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

  async updatePaidAmount(transactionId: string, paidAmount: number) {
    const transaction = await this.transactionModel.findOne({
      where: { id: transactionId },
    });
    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    const newTotalAmount = transaction.paidAmount + paidAmount;

    if (newTotalAmount > transaction.originalAmount) {
      throw new BadRequestException(
        'Paid amount is greater than the original amount',
      );
    }

    if (newTotalAmount === transaction.originalAmount) {
      transaction.status = PaymentStatus.PAID;
    }

    transaction.paidAt = new Date();
    transaction.paidAmount = transaction.paidAmount + paidAmount;
    await this.transactionModel.save(transaction);
    return transaction;
  }

  async completePayment(transactionId: string) {
    const transaction = await this.transactionModel.findOne({
      where: { id: transactionId },
    });
    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }
    transaction.status = PaymentStatus.PAID;
    transaction.paidAmount = transaction.originalAmount;
    transaction.paidAt = new Date();
    await this.transactionModel.save(transaction);
    return transaction;
  }

  async toggleNotified(transactionId: string, isNotified: boolean) {
    const transaction = await this.transactionModel.findOne({
      where: { id: transactionId },
    });
    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }
    transaction.isNotified = isNotified;
    await this.transactionModel.save(transaction);
    return transaction;
  }
}
