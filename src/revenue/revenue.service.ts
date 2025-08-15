import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Revenue, RevenueDocument } from './revenue.entity';
import { CreateRevenueDto } from './dto/create-revenue.dto';
import { UpdateRevenueDto } from './dto/update-revenue.dto';
import { Manager } from '../manager/manager.entity';
import { Gym } from '../gym/entities/gym.entity';

@Injectable()
export class RevenueService {
  constructor(
    @InjectModel(Revenue.name) private revenueModel: Model<RevenueDocument>,
    @InjectModel(Gym.name) private gymModel: Model<Gym>,
  ) {}

  async create(manager: Manager, dto: CreateRevenueDto) {
    const gym = await this.gymModel.findOne({ owner: manager.id });
    if (!gym) throw new NotFoundException('Gym not found');

    const revenue = new this.revenueModel({
      ...dto,
      date: dto.date ? new Date(dto.date) : new Date(),
      gym: new Types.ObjectId(gym.id),
    });
    return revenue.save();
  }

  async findAll(manager: Manager, start?: string, end?: string) {
    const gym = await this.gymModel.findOne({ owner: manager.id });
    if (!gym) throw new NotFoundException('Gym not found');

    const filter: any = { gym: new Types.ObjectId(gym.id) };

    if (start && end) {
      filter.date = {
        $gte: new Date(start),
        $lte: new Date(end),
      };
    } else if (start) {
      filter.date = { $gte: new Date(start) };
    } else if (end) {
      filter.date = { $lte: new Date(end) };
    }

    return this.revenueModel.find(filter).sort({ date: -1 }).exec();
  }

  async update(manager: Manager, id: string, dto: UpdateRevenueDto) {
    const gym = await this.gymModel.findOne({ owner: manager.id });
    if (!gym) throw new NotFoundException('Gym not found');

    const revenue = await this.revenueModel.findOne({
      _id: id,
      gym: new Types.ObjectId(gym.id),
    });

    if (!revenue) throw new NotFoundException('Revenue not found');

    Object.assign(revenue, {
      ...dto,
      date: dto.date ? new Date(dto.date) : revenue.date,
    });

    return revenue.save();
  }

  async remove(manager: Manager, id: string) {
    const gym = await this.gymModel.findOne({ owner: manager.id });
    if (!gym) throw new NotFoundException('Gym not found');

    const result = await this.revenueModel.deleteOne({
      _id: id,
      gym: new Types.ObjectId(gym.id),
    });

    if (result.deletedCount === 0) {
      throw new NotFoundException('Revenue not found');
    }

    return { message: 'Revenue deleted successfully' };
  }

  async getTotalRevenue(manager: Manager, start?: Date, end?: Date) {
    const gym = await this.gymModel.findOne({ owner: manager.id });
    if (!gym) throw new NotFoundException('Gym not found');

    const filter: any = { gym: new Types.ObjectId(gym.id) };

    if (start && end) {
      filter.date = { $gte: start, $lte: end };
    } else if (start) {
      filter.date = { $gte: start };
    } else if (end) {
      filter.date = { $lte: end };
    }

    const result = await this.revenueModel.aggregate([
      { $match: filter },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    return result[0]?.total || 0;
  }
}
