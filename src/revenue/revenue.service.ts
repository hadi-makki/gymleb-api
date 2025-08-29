import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateRevenueDto } from './dto/create-revenue.dto';
import { UpdateRevenueDto } from './dto/update-revenue.dto';
import { BadRequestException } from '../error/bad-request-error';
import { TransactionService } from '../transactions/subscription-instance.service';
import { InjectRepository } from '@nestjs/typeorm';
import { RevenueEntity } from './revenue.entity';
import { GymEntity } from 'src/gym/entities/gym.entity';
import { ProductEntity } from 'src/products/products.entity';
import { Between, LessThanOrEqual, MoreThanOrEqual, Repository } from 'typeorm';
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

    const createRevenueModel = this.revenueModel.create({
      title,
      amount,
      category: dto.category,
      notes: dto.notes,
      date: dto.date ? new Date(dto.date) : new Date(),
      gym: gym,
    });
    const revenue = await this.revenueModel.save(createRevenueModel);

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

    const filter: any = { gym: { id: gym.id } };

    if (start && end) {
      filter.date = Between(new Date(start), new Date(end));
    } else if (start) {
      filter.date = MoreThanOrEqual(new Date(start));
    } else if (end) {
      filter.date = LessThanOrEqual(new Date(end));
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
      where: { id: id, gym: { id: gym.id } },
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
      where: { id: id, gym: { id: gym.id } },
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

    const filter: any = { gym: { id: gym.id } };

    if (start && end) {
      filter.date = Between(start, end);
    } else if (start) {
      filter.date = MoreThanOrEqual(start);
    } else if (end) {
      filter.date = LessThanOrEqual(end);
    }

    const result = await this.revenueModel.find({
      where: filter,
    });

    return result.reduce((acc, curr) => acc + curr.amount, 0);
  }
}
