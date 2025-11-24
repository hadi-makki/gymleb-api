import { OnModuleInit } from '@nestjs/common';
import { TransactionService } from './transaction.service';
import {
  MonthlyReminderStatus,
  PaymentStatus,
  TransactionEntity,
} from './transaction.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';

export class MigrateTransactions implements OnModuleInit {
  constructor(
    @InjectRepository(TransactionEntity)
    private readonly transactionRepository: Repository<TransactionEntity>,
  ) {}

  async onModuleInit() {
    // Fetch all transaction records from the database
    const getAllTransactions = await this.transactionRepository.find();

    console.log(`Migrating ${getAllTransactions.length} transactions...`);

    await Promise.all(
      getAllTransactions.map(async (transaction) => {
        if (transaction.isNotified) {
          transaction.monthlyReminderStatus = MonthlyReminderStatus.SENT;
          await this.transactionRepository.save(transaction);
          console.log(
            `Transaction ID ${transaction.id}: isNotified=true; set monthlyReminderStatus to SENT`,
          );
        } else {
          transaction.monthlyReminderStatus = MonthlyReminderStatus.NOT_SENT;
          await this.transactionRepository.save(transaction);
          console.log(
            `Transaction ID ${transaction.id}: isNotified=false; set monthlyReminderStatus to NOT_SENT`,
          );
        }
      }),
    );

    console.log('Migration of monthlyReminderStatus finished.');
  }
}
