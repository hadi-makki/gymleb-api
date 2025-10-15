import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ExpenseEntity } from './expense.entity';

@Injectable()
export class ExpenseMigration implements OnModuleInit {
  constructor(
    @InjectRepository(ExpenseEntity)
    private expenseRepository: Repository<ExpenseEntity>,
  ) {}

  async onModuleInit() {
    // await this.moveExpensesToTemporaryColumn();
    // await this.migrateExpenses();
  }

  async moveExpensesToTemporaryColumn() {
    const expenses = await this.expenseRepository.find();

    Promise.all(
      expenses.map(async (expense) => {
        expense.amountMigration = expense.amount;
        await this.expenseRepository.save(expense);
      }),
    );
  }

  async migrateExpenses() {
    const expenses = await this.expenseRepository.find();

    Promise.all(
      expenses.map(async (expense) => {
        expense.amount = expense.amountMigration;
        await this.expenseRepository.save(expense);
      }),
    );
  }
}
