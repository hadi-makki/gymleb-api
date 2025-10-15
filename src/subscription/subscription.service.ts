import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { GymEntity } from 'src/gym/entities/gym.entity';
import { ManagerEntity } from 'src/manager/manager.entity';
import { Repository } from 'typeorm';
import { BadRequestException } from '../error/bad-request-error';
import { TransactionService } from '../transactions/transaction.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';
import {
  SubscriptionEntity,
  SubscriptionType,
} from './entities/subscription.entity';
import { isUUID } from 'class-validator';
import { Currency } from 'src/common/enums/currency.enum';
@Injectable()
export class SubscriptionService {
  constructor(
    @InjectRepository(SubscriptionEntity)
    private subscriptionModel: Repository<SubscriptionEntity>,
    @InjectRepository(GymEntity)
    private gymModel: Repository<GymEntity>,
    private readonly transactionService: TransactionService,
  ) {}
  async create(
    createSubscriptionDto: CreateSubscriptionDto,
    manager: ManagerEntity,
    gymId: string,
  ) {
    console.log(gymId);
    const gym = await this.gymModel.findOne({ where: { id: gymId } });
    if (!gym) {
      throw new NotFoundException('Gym not found');
    }
    const subscriptionDuration =
      createSubscriptionDto.type === SubscriptionType.YEARLY_GYM
        ? createSubscriptionDto.duration * 365
        : createSubscriptionDto.type === SubscriptionType.MONTHLY_GYM
          ? createSubscriptionDto.duration * 30
          : createSubscriptionDto.type === SubscriptionType.WEEKLY_GYM
            ? createSubscriptionDto.duration * 7
            : createSubscriptionDto.duration;

    const createSubscriptionModel = this.subscriptionModel.create({
      title: createSubscriptionDto.title,
      type: createSubscriptionDto.type,
      price: createSubscriptionDto.price,
      gym: gym,
      duration: subscriptionDuration,
      allowedReservations: createSubscriptionDto.allowedReservations ?? 0,
      currency: createSubscriptionDto.currency || Currency.USD,
    });
    const subscription = await this.subscriptionModel.save(
      createSubscriptionModel,
    );
    return subscription;
  }

  async findAll(gymId: string) {
    const subscriptions = await this.subscriptionModel.find({
      where: { gym: { id: gymId } },
    });
    return subscriptions;
  }

  async findOne(id: string) {
    if (!isUUID(id)) {
      throw new BadRequestException('Invalid subscription id');
    }
    const subscription = await this.subscriptionModel.findOne({
      where: { id: id },
    });
    return subscription;
  }

  async update(
    id: string,
    updateSubscriptionDto: UpdateSubscriptionDto,
    gymId: string,
  ) {
    const gym = await this.gymModel.findOne({ where: { id: gymId } });
    if (!gym) {
      throw new NotFoundException('Gym not found');
    }

    if (!isUUID(id)) {
      throw new BadRequestException('Invalid subscription id');
    }
    const subscriptionDuration =
      updateSubscriptionDto.type === SubscriptionType.YEARLY_GYM
        ? updateSubscriptionDto.duration * 365
        : updateSubscriptionDto.type === SubscriptionType.MONTHLY_GYM
          ? updateSubscriptionDto.duration * 30
          : updateSubscriptionDto.duration;

    const subscription = await this.subscriptionModel.update(id, {
      ...updateSubscriptionDto,
      duration: subscriptionDuration,
    });
    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }
    const newSubscription = await this.subscriptionModel.findOne({
      where: { id: id },
    });
    return newSubscription;
  }

  async remove(id: string, gymId: string) {
    const gym = await this.gymModel.findOne({ where: { id: gymId } });
    if (!gym) {
      throw new NotFoundException('Gym not found');
    }
    const subscription = await this.subscriptionModel.delete(id);
    return subscription;
  }

  async getSubscriptionTypes() {
    return Object.values(SubscriptionType).map((type) => ({
      label: type
        .split('_')
        .join(' ')
        .replace(/\b\w/g, (char) => char.toUpperCase()),
      value: type,
    }));
  }

  async deleteSubscription(subscriptionId: string) {
    const subscription = await this.subscriptionModel.delete(subscriptionId);

    return subscription;
  }

  async deleteSubscriptionInstance(
    subscriptionId: string,
    manager: ManagerEntity,
    gymId: string,
  ) {
    return await this.transactionService.deleteSubscriptionInstance(
      subscriptionId,
      manager,
      gymId,
    );
  }
}
