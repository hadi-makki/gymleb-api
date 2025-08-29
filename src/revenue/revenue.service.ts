import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Revenue, RevenueDocument } from './revenue.model';
import { CreateRevenueDto } from './dto/create-revenue.dto';
import { UpdateRevenueDto } from './dto/update-revenue.dto';
import { Gym } from '../gym/entities/gym.model';
import { Product } from '../products/products.model';
import { BadRequestException } from '../error/bad-request-error';
import { TransactionType } from '../transactions/transaction.model';
import { TransactionService } from '../transactions/subscription-instance.service';
import { InjectRepository } from '@nestjs/typeorm';
import { RevenueEntity } from './revenue.entity';
import { GymEntity } from 'src/gym/entities/gym.entity';
import { ProductEntity } from 'src/products/products.entity';
import { Repository } from 'typeorm';
import { ManagerEntity } from 'src/manager/manager.entity';

@Injectable()
export class RevenueService {
  constructor(
    @InjectRepository(RevenueEntity)
    private revenueModel: Repository<RevenueEntity>,
    @InjectRepository(GymEntity)
    private gymModel: Repository<GymEntity>,
    @InjectRepository(ProductEntity)
    private productModel: Repository<ProductEntity>,
    private readonly transactionService: TransactionService,
  ) {}

  async create(manager: ManagerEntity, dto: CreateRevenueDto, gymId: string) {
    const gym = await this.gymModel.findOne({ where: { id: gymId } });
    if (!gym) throw new NotFoundException('Gym not found');

    const product = await this.productModel.findOne({
      where: { id: dto.productId },
    });

    if (product && product.stock < dto.numberSold) {
      throw new BadRequestException('Product stock is not enough');
    }

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

    const revenue = await this.revenueModel.create({
      title,
      amount,
      category: dto.category,
      notes: dto.notes,
      date: dto.date ? new Date(dto.date) : new Date(),
      gym: gym,
    });
    const transaction = await this.transactionService.createRevenueTransaction({
      paidAmount: amount,
      gym: gym,
      product: product,
      numberSold: dto.numberSold,
      revenue: revenue,
      date: dto.date ? new Date(dto.date) : new Date(),
    });
    revenue.transaction = transaction;

    if (product) {
      product.stock -= dto.numberSold;
      await this.productModel.save(product);
    }

    return revenue;
  }

  async findAll(
    manager: ManagerEntity,
    start?: string,
    end?: string,
    gymId?: string,
  ) {
    const gym = await this.gymModel.findOne({ where: { id: gymId } });
    if (!gym) throw new NotFoundException('Gym not found');

    const filter: any = { gym: gym };

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

    return await this.revenueModel.find({
      where: filter,
      relations: ['transaction'],
      order: { date: 'DESC' },
    });
  }

  async update(
    manager: ManagerEntity,
    id: string,
    dto: UpdateRevenueDto,
    gymId: string,
  ) {
    const gym = await this.gymModel.findOne({ where: { id: gymId } });
    if (!gym) throw new NotFoundException('Gym not found');

    const revenue = await this.revenueModel.findOne({
      where: { id: id, gym: gym },
    });

    if (!revenue) throw new NotFoundException('Revenue not found');

    Object.assign(revenue, {
      ...dto,
      date: dto.date ? new Date(dto.date) : revenue.date,
    });

    return await this.revenueModel.save(revenue);
  }

  async remove(manager: ManagerEntity, id: string, gymId: string) {
    const gym = await this.gymModel.findOne({ where: { id: gymId } });
    if (!gym) throw new NotFoundException('Gym not found');

    const revenue = await this.revenueModel.findOne({
      where: { id: id, gym: gym },
    });

    if (!revenue) throw new NotFoundException('Revenue not found');

    await this.revenueModel.delete(id);

    // remove transaction
    await this.transactionService.removeRevenueTransaction(id);

    return { message: 'Revenue deleted successfully' };
  }

  async getTotalRevenue(
    manager: ManagerEntity,
    start?: Date,
    end?: Date,
    gymId?: string,
  ) {
    const gym = await this.gymModel.findOne({ where: { id: gymId } });
    if (!gym) throw new NotFoundException('Gym not found');

    const filter: any = { gym: gym };

    if (start && end) {
      filter.date = { $gte: start, $lte: end };
    } else if (start) {
      filter.date = { $gte: start };
    } else if (end) {
      filter.date = { $lte: end };
    }

    const result = await this.revenueModel.find({
      where: filter,
    });

    return result.reduce((acc, curr) => acc + curr.amount, 0);
  }
}
