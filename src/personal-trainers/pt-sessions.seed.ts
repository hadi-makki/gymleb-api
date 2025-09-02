import { OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PTSessionEntity } from './entities/pt-sessions.entity';
import { Repository } from 'typeorm';
import { TransactionEntity } from 'src/transactions/transaction.entity';

export class PtSessionsSeed implements OnModuleInit {
  constructor(
    @InjectRepository(PTSessionEntity)
    private readonly ptSessionModel: Repository<PTSessionEntity>,
    @InjectRepository(TransactionEntity)
    private readonly transactionModel: Repository<TransactionEntity>,
  ) {}
  async onModuleInit() {
    // const ptSessions = await this.ptSessionModel.find({
    //   relations: {
    //     personalTrainer: true,
    //     member: true,
    //     gym: true,
    //     transaction: true,
    //   },
    // });
    // for (const ptSession of ptSessions) {
    //   ptSession.members = [ptSession.member];
    //   console.log(ptSession.members);
    //   ptSession.transactions = [ptSession.transaction];
    //   await this.ptSessionModel.save(ptSession);
    //   //   ptSession.
    // }
  }
}
