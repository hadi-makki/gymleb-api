import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { NotFoundException } from 'src/error/not-found-error';
import { Product } from 'src/products/products.entity';
import { PaymentDetails } from 'src/stripe/stripe.interface';
import { User } from 'src/user/user.entity';
import { Transaction } from './transaction.entity';

@Injectable()
export class TransactionsService {
  constructor(
    @InjectModel(Transaction.name)
    private readonly transactionRepository: Model<Transaction>,
    @InjectModel(User.name)
    private readonly userRepository: Model<User>,
    @InjectModel(Product.name)
    private readonly productRepository: Model<Product>,
  ) {}
  async createTransaction(paymentDetails: PaymentDetails) {}

  async createAiPhoneNumberTransaction(paymentDetails: PaymentDetails) {
    console.log('these are the payment details', paymentDetails);
    const getUser = await this.userRepository.findById(
      paymentDetails.metadata.userId,
    );

    if (!getUser) {
      throw new NotFoundException('User not found');
    }

    const product = await this.productRepository.findById(
      paymentDetails.metadata.productId,
    );

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // ai phone number is a one-time purchase
    const newTransaction = this.transactionRepository.create({
      invoiceId: paymentDetails.invoiceId,
      user: getUser,
      invoiceDate: paymentDetails.created,
      status: paymentDetails.status,
      product,
    });

    await newTransaction;
  }
}
