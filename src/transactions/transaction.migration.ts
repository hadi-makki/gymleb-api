import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TransactionEntity, SubscriptionStatus } from './transaction.entity';

@Injectable()
export class TransactionMigration implements OnModuleInit {
  constructor(
    @InjectRepository(TransactionEntity)
    private transactionRepository: Repository<TransactionEntity>,
  ) {}

  async onModuleInit() {
    // Uncomment to run migration
    // await this.setDefaultSubscriptionStatus();
  }

  async setDefaultSubscriptionStatus() {
    // Set default subscriptionStatus for all existing transactions
    // This ensures backward compatibility
    await this.transactionRepository
      .createQueryBuilder()
      .update(TransactionEntity)
      .set({ subscriptionStatus: SubscriptionStatus.ON_GOING })
      .where('subscriptionStatus IS NULL')
      .execute();
  }
}
