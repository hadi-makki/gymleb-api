import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { NotFoundException } from '../error/not-found-error';
import { Product } from '../products/products.entity';
import { PaymentDetails } from '../stripe/stripe.interface';
import { User } from '../user/user.entity';
import { Transaction } from './transaction.entity';
import { Member } from '../member/entities/member.entity';
import { Gym } from '../gym/entities/gym.entity';
import {
  Subscription,
  SubscriptionType,
} from '../subscription/entities/subscription.entity';
import { addDays } from 'date-fns';
@Injectable()
export class TransactionsService {
  constructor(
    @InjectModel(Transaction.name)
    private readonly transactionRepository: Model<Transaction>,
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
  ) {}
  async createTransaction(paymentDetails: PaymentDetails) {
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

    const newTransaction = this.transactionRepository.create({
      member: getMember,
      gym: getGym,
      subscription: getSubscription,
      endDate: addDays(new Date(), getSubscription.duration).toISOString(),
      paidAmount: paymentDetails.amount,
    });
    return newTransaction;
  }

  async createAiPhoneNumberTransaction(paymentDetails: PaymentDetails) {}

  async findAllTransactions(memberId: string) {
    return this.transactionRepository
      .find({ member: memberId })
      .populate('subscription')
      .populate('gym');
  }
}
