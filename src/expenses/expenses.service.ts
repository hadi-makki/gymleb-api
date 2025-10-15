import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { GymEntity } from 'src/gym/entities/gym.entity';
import { ManagerEntity } from 'src/manager/manager.entity';
import { Repository } from 'typeorm';
import { TransactionService } from '../transactions/transaction.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { ExpenseEntity } from './expense.entity';
import { Currency } from 'src/common/enums/currency.enum';

@Injectable()
export class ExpensesService {
  constructor(
    @InjectRepository(ExpenseEntity)
    private expenseModel: Repository<ExpenseEntity>,
    @InjectRepository(GymEntity)
    private gymModel: Repository<GymEntity>,
    private readonly transactionService: TransactionService,
  ) {}

  async create(manager: ManagerEntity, dto: CreateExpenseDto) {
    const gym = await this.gymModel.findOne({
      where: { id: dto.gymId },
    });
    if (!gym) throw new NotFoundException('Gym not found');
    const expense = this.expenseModel.create({
      ...dto,
      date: dto.date ? new Date(dto.date) : new Date(),
      currency: dto.currency ?? Currency.USD,
      gym: { id: dto.gymId },
    });
    const transaction = await this.transactionService.createExpenseTransaction({
      paidAmount: dto.amount,
      gym: gym,
      expense: expense,
      title: expense.title,
      date: expense.date,
      currency: expense.currency,
    });
    expense.transaction = transaction;
    await this.expenseModel.save(expense);
    return await this.expenseModel.findOne({
      where: { id: expense.id },
      relations: ['transaction'],
    });
  }

  async findAll(
    manager: ManagerEntity,
    start?: string,
    end?: string,
    gymId?: string,
  ) {
    const gym = await this.gymModel.findOne({
      where: { id: gymId },
    });
    if (!gym) throw new NotFoundException('Gym not found');
    const filter: any = { gym: { id: gymId } };
    if (start || end) {
      filter.date = {};
      if (start) filter.date.$gte = new Date(start);
      if (end) filter.date.$lte = new Date(end);
    }
    return this.expenseModel.find({
      where: filter,
      order: { date: 'DESC' },
      relations: ['transaction'],
    });
  }

  async update(
    manager: ManagerEntity,
    id: string,
    dto: UpdateExpenseDto,
    gymId: string,
  ) {
    const gym = await this.gymModel.findOne({
      where: { id: gymId },
    });
    if (!gym) throw new NotFoundException('Gym not found');

    const expense = await this.expenseModel.update(
      { id: id, gym: { id: gymId } },
      {
        ...dto,
        ...(dto.date ? { date: new Date(dto.date) } : {}),
        gym: { id: gymId },
      },
    );
    if (!expense) throw new NotFoundException('Expense not found');
    return expense;
  }

  async remove(manager: ManagerEntity, id: string, gymId: string) {
    const gym = await this.gymModel.findOne({
      where: { id: gymId },
    });
    if (!gym) throw new NotFoundException('Gym not found');
    await this.transactionService.removeExpenseTransaction(id);
    const expense = await this.expenseModel.delete({
      id: id,
      gym: { id: gymId },
    });
    if (!expense) throw new NotFoundException('Expense not found');

    return { success: true };
  }
}
