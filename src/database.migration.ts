import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { InjectRepository } from '@nestjs/typeorm';
import { Model, Types } from 'mongoose';
import { Repository } from 'typeorm';

// TypeORM Entities (Postgres)
import { ExpenseEntity } from './expenses/expense.entity';
import { GymEntity } from './gym/entities/gym.entity';
import { ManagerEntity } from './manager/manager.entity';
import { MediaEntity } from './media/media.entity';
import { MemberEntity } from './member/entities/member.entity';
import { OwnerSubscriptionTypeEntity } from './owner-subscriptions/owner-subscription-type.entity';
import { PTSessionEntity } from './personal-trainers/entities/pt-sessions.entity';
import { ProductEntity } from './products/products.entity';
import { RevenueEntity } from './revenue/revenue.entity';
import { SubscriptionEntity } from './subscription/entities/subscription.entity';
import { TokenEntity } from './token/token.entity';
import {
  TransactionEntity,
  TransactionType,
} from './transactions/transaction.entity';

// Mongoose Models (Mongo)
import { Permissions } from './decorators/roles/role.enum';
import { BadRequestException } from './error/bad-request-error';

@Injectable()
export class DatabaseMigration implements OnModuleInit {
  constructor(
    // TypeORM repos
    @InjectRepository(ManagerEntity)
    private readonly managerRepository: Repository<ManagerEntity>,
    @InjectRepository(GymEntity)
    private readonly gymRepository: Repository<GymEntity>,
    @InjectRepository(OwnerSubscriptionTypeEntity)
    private readonly ownerSubscriptionTypeRepository: Repository<OwnerSubscriptionTypeEntity>,
    @InjectRepository(TokenEntity)
    private readonly tokenRepository: Repository<TokenEntity>,
    @InjectRepository(MemberEntity)
    private readonly memberRepository: Repository<MemberEntity>,
    @InjectRepository(MediaEntity)
    private readonly mediaRepository: Repository<MediaEntity>,
    @InjectRepository(ExpenseEntity)
    private readonly expenseRepository: Repository<ExpenseEntity>,
    @InjectRepository(RevenueEntity)
    private readonly revenueRepository: Repository<RevenueEntity>,
    @InjectRepository(ProductEntity)
    private readonly productRepository: Repository<ProductEntity>,
    @InjectRepository(SubscriptionEntity)
    private readonly subscriptionRepository: Repository<SubscriptionEntity>,
    @InjectRepository(TransactionEntity)
    private readonly transactionRepository: Repository<TransactionEntity>,
    @InjectRepository(PTSessionEntity)
    private readonly ptSessionRepository: Repository<PTSessionEntity>,
  ) {}
  async onModuleInit() {
    // await this.firstStep();
    // await this.secondStep();
  }

  async firstStep() {
    await this.fixExpensesDate();
    await this.fixRevenuesDate();
    await this.fixTokensDate();
    await this.fixTransactionsDate();
    await this.fixPTSessionsDate();
  }

  async secondStep() {
    await this.retrieveExpensesDate();
    await this.retrieveRevenuesDate();
    await this.retrieveTokensDate();
    await this.retrieveTransactionsDate();
    await this.retrievePTSessionsDate();
  }

  async retrieveExpensesDate() {
    const expenses = await this.expenseRepository.find();
  }

  async retrieveRevenuesDate() {
    const revenues = await this.revenueRepository.find();
  }

  async retrieveTokensDate() {
    const tokens = await this.tokenRepository.find();
  }

  async retrieveTransactionsDate() {
    const transactions = await this.transactionRepository.find();
  }

  async retrievePTSessionsDate() {
    const ptSessions = await this.ptSessionRepository.find();
  }

  async fixExpensesDate() {
    const expenses = await this.expenseRepository.find();
  }

  async fixRevenuesDate() {
    const revenues = await this.revenueRepository.find();
  }

  async fixTokensDate() {
    const tokens = await this.tokenRepository.find();
  }

  async fixTransactionsDate() {
    const transactions = await this.transactionRepository.find();
  }

  async fixPTSessionsDate() {
    const ptSessions = await this.ptSessionRepository.find();
  }
}
