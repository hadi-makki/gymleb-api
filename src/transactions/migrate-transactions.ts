import { OnModuleInit } from '@nestjs/common';
import { TransactionService } from './transaction.service';
import { PaymentStatus, TransactionEntity } from './transaction.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

export class MigrateTransactions implements OnModuleInit {
  constructor(
    @InjectRepository(TransactionEntity)
    private readonly transactionRepository: Repository<TransactionEntity>,
  ) {}

  async onModuleInit() {
    // await this.migrateTransactions();
    // await this.migrateTransactionAmounts();
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
      where: { isPaid: true },
    });
    for (const transaction of transactions) {
      transaction.originalAmount = transaction.paidAmount;
      await this.transactionRepository.save(transaction);
    }
  }
}
