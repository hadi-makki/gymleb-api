import { Model } from 'mongoose';
import { Product } from '../products/products.entity';
import { PaymentDetails } from '../stripe/stripe.interface';
import { User } from '../user/user.entity';
import { Transaction } from './transaction.entity';
import { Member } from '../member/entities/member.entity';
import { Gym } from '../gym/entities/gym.entity';
import { Subscription } from '../subscription/entities/subscription.entity';
export declare class TransactionsService {
    private readonly transactionRepository;
    private readonly userRepository;
    private readonly productRepository;
    private readonly memberRepository;
    private readonly gymRepository;
    private readonly subscriptionRepository;
    constructor(transactionRepository: Model<Transaction>, userRepository: Model<User>, productRepository: Model<Product>, memberRepository: Model<Member>, gymRepository: Model<Gym>, subscriptionRepository: Model<Subscription>);
    createTransaction(paymentDetails: PaymentDetails): Promise<import("mongoose").Document<unknown, {}, Transaction, {}> & Transaction & Required<{
        _id: unknown;
    }> & {
        __v: number;
    }>;
    createAiPhoneNumberTransaction(paymentDetails: PaymentDetails): Promise<void>;
    findAllTransactions(memberId: string): Promise<(import("mongoose").Document<unknown, {}, Transaction, {}> & Transaction & Required<{
        _id: unknown;
    }> & {
        __v: number;
    })[]>;
}
