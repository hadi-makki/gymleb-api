import { Injectable, OnModuleInit, Scope } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Transaction, TransactionType } from './transaction.entity';
import { SubscriptionInstance } from './subscription-instance.entity';
import { Member } from '../member/entities/member.entity';
import { Gym } from '../gym/entities/gym.model';
import { Product } from '../products/products.entity';

@Injectable({ scope: Scope.DEFAULT })
export class TransactionSeeding implements OnModuleInit {
  constructor(
    @InjectModel(Transaction.name)
    private transactionRepository: Model<Transaction>,
    @InjectModel(SubscriptionInstance.name)
    private subscriptionInstanceRepository: Model<SubscriptionInstance>,
    @InjectModel(Member.name)
    private memberRepository: Model<Member>,
    @InjectModel(Gym.name)
    private gymRepository: Model<Gym>,
    @InjectModel(Product.name)
    private productRepository: Model<Product>,
  ) {}

  async migrateTransactions() {
    // move transactions to subscription instances
    const getSubscriptionInstances =
      await this.subscriptionInstanceRepository.find();
    for (const subscriptionInstance of getSubscriptionInstances) {
      const existingTransaction = await this.transactionRepository.findById(
        subscriptionInstance._id,
      );

      if (!existingTransaction) {
        await this.transactionRepository.create({
          _id: subscriptionInstance._id,
          type: TransactionType.SUBSCRIPTION,
          endDate: subscriptionInstance.endDate,
          startDate: subscriptionInstance.startDate,
          paidAmount: subscriptionInstance.paidAmount,
          gym: subscriptionInstance.gym,
          subscription: subscriptionInstance.subscription,
          member: subscriptionInstance.member,
          owner: subscriptionInstance.owner,
          ownerSubscriptionType: subscriptionInstance.ownerSubscriptionType,
          isOwnerSubscriptionAssignment:
            subscriptionInstance.isOwnerSubscriptionAssignment,
          paidBy: subscriptionInstance.paidBy,
          isInvalidated: subscriptionInstance.isInvalidated,
          createdAt: subscriptionInstance.createdAt,
          updatedAt: subscriptionInstance.updatedAt,
        });
      }
    }

    // move member subscription instances to transactions
    const getMembers = await this.memberRepository
      .find()
      .populate('transactions')
      .populate('subscriptionInstances');

    for (const member of getMembers) {
      const transactions = member.transactions || [];
      console.log('transactions', transactions);
      const transactionsIds = [
        ...transactions?.map((transaction) => transaction?.id),
        ...member.subscriptionInstances.map(
          (subscriptionInstance) => subscriptionInstance?.id,
        ),
      ];
      let checkTransactions: Transaction[] = [];
      for (const transactionId of transactionsIds) {
        const transaction =
          await this.transactionRepository.findById(transactionId);
        if (transaction) {
          checkTransactions.push(transaction);
        }
      }
      member.transactions = checkTransactions;
      await member.save();
    }

    const getGyms = await this.gymRepository
      .find()
      .populate('transactions')
      .populate('subscriptionInstances');
    for (const gym of getGyms) {
      const transactions = gym.transactions || [];
      const transactionsIds = [
        ...transactions?.map((transaction) => transaction?.id),
        ...gym.subscriptionInstances.map(
          (subscriptionInstance) => subscriptionInstance?.id,
        ),
      ];
      let checkTransactions: Transaction[] = [];
      for (const transactionId of transactionsIds) {
        const transaction =
          await this.transactionRepository.findById(transactionId);
        checkTransactions.push(transaction);
      }
      gym.transactions = checkTransactions;
      await gym.save();
    }

    const getProducts = await this.productRepository
      .find()
      .populate('transactions')
      .populate('subscriptionInstances');
    for (const product of getProducts) {
      const transactions = product.transactions || [];
      const transactionsIds = [
        ...transactions.map((transaction) => transaction.id),
      ];
      let checkTransactions: Transaction[] = [];
      for (const transactionId of transactionsIds) {
        const transaction =
          await this.transactionRepository.findById(transactionId);
        checkTransactions.push(transaction);
      }
      product.transactions = checkTransactions;
      await product.save();
    }
  }

  async onModuleInit() {
    // await this.migrateTransactions();
  }
}
