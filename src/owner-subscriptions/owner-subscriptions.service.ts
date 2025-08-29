import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { OwnerSubscriptionType } from './owner-subscription-type.model';
import { OwnerSubscription } from './owner-subscription.model';

import {
  AssignOwnerSubscriptionDto,
  CreateOwnerSubscriptionTypeDto,
} from './dto';
import { Manager } from '../manager/manager.model';
import { TransactionService } from '../transactions/subscription-instance.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ManagerEntity } from 'src/manager/manager.entity';
import { OwnerSubscriptionEntity } from './owner-subscription.entity';
import { OwnerSubscriptionTypeEntity } from './owner-subscription-type.entity';

@Injectable()
export class OwnerSubscriptionsService {
  constructor(
    @InjectRepository(OwnerSubscriptionTypeEntity)
    private typeModel: Repository<OwnerSubscriptionTypeEntity>,
    @InjectRepository(OwnerSubscriptionEntity)
    private subModel: Repository<OwnerSubscriptionEntity>,
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

  async assign(dto: AssignOwnerSubscriptionDto) {
    const owner = await this.ownerModel.findOne({ where: { id: dto.ownerId } });
    if (!owner) throw new NotFoundException('Owner not found');
    const type = await this.typeModel.findOne({ where: { id: dto.typeId } });
    if (!type) throw new NotFoundException('Type not found');
    const start = dto.startDate ? new Date(dto.startDate) : new Date();
    const end = new Date(start);
    end.setDate(end.getDate() + type.durationDays);
    // deactivate previous subs
    await this.subModel.update(
      { owner: owner, active: true },
      { active: false },
    );
    const createdModel = this.subModel.create({
      owner: owner,
      type: type,
      startDate: start,
      endDate: end,
      active: true,
    });
    const created = await this.subModel.save(createdModel);
    // create transaction for the assignment so super admin can see it later
    await this.transactionService.createOwnerSubscriptionAssignmentInstance({
      ownerId: owner.id,
      ownerSubscriptionTypeId: type.id,
      paidAmount: type.price,
      endDateIso: end.toISOString(),
    });
    return created;
  }

  async getOwnerSubscription(ownerId: string) {
    return await this.subModel.findOne({
      where: { owner: { id: ownerId }, active: true },
      relations: ['type'],
    });
  }

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
