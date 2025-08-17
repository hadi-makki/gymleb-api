import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { OwnerSubscriptionType } from './owner-subscription-type.entity';
import { OwnerSubscription } from './owner-subscription.entity';

import {
  AssignOwnerSubscriptionDto,
  CreateOwnerSubscriptionTypeDto,
} from './dto';
import { Manager } from 'src/manager/manager.entity';
import { TransactionService } from '../transactions/subscription-instance.service';

@Injectable()
export class OwnerSubscriptionsService {
  constructor(
    @InjectModel(OwnerSubscriptionType.name)
    private typeModel: Model<OwnerSubscriptionType>,
    @InjectModel(OwnerSubscription.name)
    private subModel: Model<OwnerSubscription>,
    @InjectModel(Manager.name) private ownerModel: Model<Manager>,
    private readonly transactionService: TransactionService,
  ) {}

  async createType(dto: CreateOwnerSubscriptionTypeDto) {
    console.log(dto);
    return await this.typeModel.create({
      title: dto.title,
      price: dto.price,
      durationDays: dto.durationDays,
      description: dto.description,
    });
  }

  async listTypes() {
    return await this.typeModel.find().sort({ createdAt: -1 });
  }

  async assign(dto: AssignOwnerSubscriptionDto) {
    const owner = await this.ownerModel.findById(dto.ownerId);
    if (!owner) throw new NotFoundException('Owner not found');
    const type = await this.typeModel.findById(dto.typeId);
    if (!type) throw new NotFoundException('Type not found');
    const start = dto.startDate ? new Date(dto.startDate) : new Date();
    const end = new Date(start);
    end.setDate(end.getDate() + type.durationDays);
    // deactivate previous subs
    await this.subModel.updateMany(
      { owner: owner._id, active: true },
      { active: false },
    );
    const created = await this.subModel.create({
      owner: owner._id,
      type: type._id,
      startDate: start,
      endDate: end,
      active: true,
    });
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
    return await this.subModel
      .findOne({ owner: new Types.ObjectId(ownerId), active: true })
      .populate('type');
  }

  async deleteType(id: string) {
    return await this.typeModel.findByIdAndDelete(id);
  }

  async updateType(id: string, dto: CreateOwnerSubscriptionTypeDto) {
    const check = await this.typeModel.findById(id);
    if (!check) throw new NotFoundException('Type not found');
    check.title = dto.title;
    check.price = dto.price;
    check.durationDays = dto.durationDays;
    check.description = dto.description;
    return await check.save();
  }
}
