import { OnModuleInit } from '@nestjs/common';
import { TransactionService } from './transaction.service';
import { PaymentStatus, TransactionEntity } from './transaction.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';

export class MigrateTransactions implements OnModuleInit {
  constructor(
    @InjectRepository(TransactionEntity)
    private readonly transactionRepository: Repository<TransactionEntity>,
  ) {}

  async onModuleInit() {
    // await this.migrateTransactions();
    // await this.migrateTransactionAmounts();
    // await this.migrateIsNotified();
  }

  async migrateIsNotified() {
    const transactions = await this.transactionRepository.find({
      where: {
        member: {
          isNotified: true,
        },
        isNotified: false,
      },
      relations: {
        member: true,
      },
    });
    const length = transactions.length;
    let count = 0;
    console.log('this is the length', length);
    console.log('this is the transactions', transactions[0].member.isNotified);
    console.log(
      'filter transactions',
      transactions.filter((t) => !t.member.isNotified).length,
    );
    // Promise.all(
    //   transactions.map(async (transaction) => {
    //     if (transaction.member.isNotified) {
    //       transaction.isNotified = true;
    //       await this.transactionRepository.save(transaction);
    //     }
    //   }),
    // );
  }

  async migrateTransactions() {
    const transactions = await this.transactionRepository.find({
      where: { isPaid: false },
    });
    for (const transaction of transactions) {
      transaction.status = transaction.isPaid
        ? PaymentStatus.PAID
        : PaymentStatus.UNPAID;
      await this.transactionRepository.save(transaction);
    }
  }

  async migrateTransactionAmounts() {
    const transactions = await this.transactionRepository.find({
      where: { originalAmount: IsNull() },
    });
    console.log(transactions.length);
    let count = 0;

    // Promise.all(
    //   transactions.map(async (transaction) => {
    //     transaction.originalAmount = transaction.paidAmount;
    //     await this.transactionRepository.save(transaction);
    //   }),
    // );
  }
}
