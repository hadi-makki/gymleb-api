import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { ManagerEntity } from 'src/manager/manager.entity';
import { Repository } from 'typeorm';
import { TransactionService } from '../transactions/subscription-instance.service';
import { TransactionType } from '../transactions/transaction.entity';
import {
  AssignOwnerSubscriptionDto,
  CreateOwnerSubscriptionTypeDto,
} from './dto';
import { OwnerSubscriptionTypeEntity } from './owner-subscription-type.entity';
import { GymEntity } from 'src/gym/entities/gym.entity';
import { GymService } from 'src/gym/gym.service';

@Injectable()
export class OwnerSubscriptionsService {
  constructor(
    @InjectRepository(OwnerSubscriptionTypeEntity)
    private typeModel: Repository<OwnerSubscriptionTypeEntity>,
    @InjectRepository(ManagerEntity)
    private ownerModel: Repository<ManagerEntity>,
    private readonly transactionService: TransactionService,
    @InjectRepository(GymEntity)
    private gymModel: Repository<GymEntity>,
    private readonly gymService: GymService,
  ) {}

  async createType(dto: CreateOwnerSubscriptionTypeDto) {
    const createTypeModel = this.typeModel.create({
      title: dto.title,
      price: dto.price,
      durationDays: dto.durationDays,
      description: dto.description,
      allowedNotificationsNumber: dto.allowedNotificationsNumber,
    });
    return await this.typeModel.save(createTypeModel);
  }

  async listTypes() {
    return await this.typeModel.find({ order: { createdAt: 'DESC' } });
  }

  async assign(dto: AssignOwnerSubscriptionDto) {}

  async getOwnerSubscription(gymId: string) {
    // Get the gym with its transactions
    const gym = await this.gymModel.findOne({
      where: { id: gymId },
      relations: {
        transactions: {
          ownerSubscriptionType: true,
        },
      },
    });

    if (!gym) {
      throw new NotFoundException('Gym not found');
    }

    return await this.gymService.getGymActiveSubscription(gym);
  }

  async deleteType(id: string) {
    // Check if the subscription type exists
    const subscriptionType = await this.typeModel.findOne({ where: { id } });
    if (!subscriptionType) {
      throw new NotFoundException('Subscription type not found');
    }

    // Delete the subscription type
    await this.typeModel.remove(subscriptionType);

    return {
      message: 'Subscription type deleted successfully',
      deletedType: subscriptionType.title,
    };
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

  async setSubscriptionToGym(subscriptionTypeId: string, gymId: string) {
    const subscriptionType = await this.typeModel.findOne({
      where: { id: subscriptionTypeId },
    });
    if (!subscriptionType) {
      throw new NotFoundException('Subscription type not found');
    }
    const gym = await this.gymModel.findOne({ where: { id: gymId } });
    if (!gym) {
      throw new NotFoundException('Gym not found');
    }
    gym.ownerSubscriptionType = subscriptionType;
    gym.membersNotified = 0;
    gym.welcomeMessageNotified = 0;
    return await this.gymModel.save(gym);
  }
}
