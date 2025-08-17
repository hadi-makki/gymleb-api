import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Subscription, SubscriptionType } from './entities/subscription.entity';
import { Model } from 'mongoose';
import { Gym } from '../gym/entities/gym.entity';
import { Manager } from '../manager/manager.entity';
import { isMongoId } from 'validator';
import { BadRequestException } from '../error/bad-request-error';
import { TransactionService } from '../transactions/subscription-instance.service';
@Injectable()
export class SubscriptionService {
  constructor(
    @InjectModel(Subscription.name)
    private subscriptionModel: Model<Subscription>,
    @InjectModel(Gym.name)
    private gymModel: Model<Gym>,
    private readonly transactionService: TransactionService,
  ) {}
  async create(createSubscriptionDto: CreateSubscriptionDto, manager: Manager) {
    const gym = await this.gymModel.findOne({ owner: manager._id.toString() });
    if (!gym) {
      throw new NotFoundException('Gym not found');
    }
    const subscriptionDuration =
      createSubscriptionDto.type === SubscriptionType.YEARLY_GYM
        ? createSubscriptionDto.duration * 365
        : createSubscriptionDto.type === SubscriptionType.MONTHLY_GYM
          ? createSubscriptionDto.duration * 30
          : createSubscriptionDto.duration;

    const subscription = await this.subscriptionModel.create({
      title: createSubscriptionDto.title,
      type: createSubscriptionDto.type,
      price: createSubscriptionDto.price,
      gym: gym.id,
      duration: subscriptionDuration,
    });
    return subscription;
  }

  async findAll(manager: Manager) {
    const gym = await this.gymModel.findOne({ owner: manager._id.toString() });
    const subscriptions = await this.subscriptionModel.find({ gym: gym.id });
    return subscriptions;
  }

  async findOne(id: string) {
    if (!isMongoId(id)) {
      throw new BadRequestException('Invalid subscription id');
    }
    const subscription = await this.subscriptionModel.findById(id);
    return subscription;
  }

  async update(id: string, updateSubscriptionDto: UpdateSubscriptionDto) {
    if (!isMongoId(id)) {
      throw new BadRequestException('Invalid subscription id');
    }
    const subscriptionDuration =
      updateSubscriptionDto.type === SubscriptionType.YEARLY_GYM
        ? updateSubscriptionDto.duration * 365
        : updateSubscriptionDto.type === SubscriptionType.MONTHLY_GYM
          ? updateSubscriptionDto.duration * 30
          : updateSubscriptionDto.duration;
    const subscription = await this.subscriptionModel.findByIdAndUpdate(id, {
      ...updateSubscriptionDto,
      duration: subscriptionDuration,
    });
    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }
    const newSubscription = await this.subscriptionModel.findById(id);
    return newSubscription;
  }

  async remove(id: string) {
    const subscription = await this.subscriptionModel.findByIdAndDelete(id);
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
    const subscription =
      await this.subscriptionModel.findByIdAndDelete(subscriptionId);
    return subscription;
  }

  async deleteSubscriptionInstance(subscriptionId: string, manager: Manager) {
    return await this.transactionService.deleteSubscriptionInstance(
      subscriptionId,
      manager,
    );
  }
}
