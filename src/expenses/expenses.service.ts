import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Expense } from './expense.entity';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { Manager } from '../manager/manager.entity';
import { Gym } from '../gym/entities/gym.entity';

@Injectable()
export class ExpensesService {
  constructor(
    @InjectModel(Expense.name) private expenseModel: Model<Expense>,
    @InjectModel(Gym.name) private gymModel: Model<Gym>,
  ) {}

  async create(manager: Manager, dto: CreateExpenseDto) {
    const gym = await this.gymModel.findOne({ owner: manager.id });
    if (!gym) throw new NotFoundException('Gym not found');
    const expense = new this.expenseModel({
      ...dto,
      date: dto.date ? new Date(dto.date) : new Date(),
      gym: new Types.ObjectId(gym.id),
    });
    return expense.save();
  }

  async findAll(manager: Manager, start?: string, end?: string) {
    const gym = await this.gymModel.findOne({ owner: manager.id });
    if (!gym) throw new NotFoundException('Gym not found');
    const filter: any = { gym: new Types.ObjectId(gym.id) };
    if (start || end) {
      filter.date = {};
      if (start) filter.date.$gte = new Date(start);
      if (end) filter.date.$lte = new Date(end);
    }
    return this.expenseModel.find(filter).sort({ date: -1 });
  }

  async update(manager: Manager, id: string, dto: UpdateExpenseDto) {
    const gym = await this.gymModel.findOne({ owner: manager.id });
    if (!gym) throw new NotFoundException('Gym not found');
    const expense = await this.expenseModel.findOneAndUpdate(
      { _id: id, gym: new Types.ObjectId(gym.id) },
      { ...dto, ...(dto.date ? { date: new Date(dto.date) } : {}) },
      { new: true },
    );
    if (!expense) throw new NotFoundException('Expense not found');
    return expense;
  }

  async remove(manager: Manager, id: string) {
    const gym = await this.gymModel.findOne({ owner: manager.id });
    if (!gym) throw new NotFoundException('Gym not found');
    const expense = await this.expenseModel.findOneAndDelete({
      _id: id,
      gym: new Types.ObjectId(gym.id),
    });
    if (!expense) throw new NotFoundException('Expense not found');
    return { success: true };
  }
}
