import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Revenue, RevenueDocument } from './revenue.entity';
import { CreateRevenueDto } from './dto/create-revenue.dto';
import { UpdateRevenueDto } from './dto/update-revenue.dto';
import { Manager } from '../manager/manager.entity';
import { Gym } from '../gym/entities/gym.entity';
import { Product } from 'src/products/products.entity';
import { BadRequestException } from 'src/error/bad-request-error';

@Injectable()
export class RevenueService {
  constructor(
    @InjectModel(Revenue.name) private revenueModel: Model<RevenueDocument>,
    @InjectModel(Gym.name) private gymModel: Model<Gym>,
    @InjectModel(Product.name) private productModel: Model<Product>,
  ) {}

  async create(manager: Manager, dto: CreateRevenueDto) {
    const gym = await this.gymModel.findOne({ owner: manager.id });
    if (!gym) throw new NotFoundException('Gym not found');

    const product = await this.productModel.findOne({
      _id: dto.productId,
    });

    if (!product && dto.productId)
      throw new NotFoundException('Product not found');

    if (!product && !dto.numberSold && dto.productId) {
      throw new BadRequestException('Product or number sold is required');
    }
    const amount =
      product && dto.numberSold ? product.price * dto.numberSold : dto.amount;
    const title =
      product && dto.numberSold
        ? `Sold ${dto.numberSold} ${product.name}`
        : dto.title;

    const revenue = new this.revenueModel({
      title,
      amount,
      category: dto.category,
      notes: dto.notes,
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
