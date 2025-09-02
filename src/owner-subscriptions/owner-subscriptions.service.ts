import { Injectable, NotFoundException } from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { ManagerEntity } from 'src/manager/manager.entity';
import { Repository } from 'typeorm';
import { TransactionService } from '../transactions/subscription-instance.service';
import {
  AssignOwnerSubscriptionDto,
  CreateOwnerSubscriptionTypeDto,
} from './dto';
import { OwnerSubscriptionTypeEntity } from './owner-subscription-type.entity';

@Injectable()
export class OwnerSubscriptionsService {
  constructor(
    @InjectRepository(OwnerSubscriptionTypeEntity)
    private typeModel: Repository<OwnerSubscriptionTypeEntity>,
    @InjectRepository(ManagerEntity)
    private ownerModel: Repository<ManagerEntity>,
    private readonly transactionService: TransactionService,
  ) {}

  async createType(dto: CreateOwnerSubscriptionTypeDto) {
    const createTypeModel = this.typeModel.create({
      title: dto.title,
      price: dto.price,
      durationDays: dto.durationDays,
      description: dto.description,
    });
    return await this.typeModel.save(createTypeModel);
  }

  async listTypes() {
    return await this.typeModel.find({ order: { createdAt: 'DESC' } });
  }

  async assign(dto: AssignOwnerSubscriptionDto) {}

  async getOwnerSubscription(ownerId: string) {}

  async deleteType(id: string) {
    return await this.typeModel.delete(id);
  }

  async updateType(id: string, dto: CreateOwnerSubscriptionTypeDto) {
    const check = await this.typeModel.findOne({ where: { id } });
    if (!check) throw new NotFoundException('Type not found');
    check.title = dto.title;
    check.price = dto.price;
    check.durationDays = dto.durationDays;
    check.description = dto.description;
    return await this.typeModel.save(check);
  }
}
