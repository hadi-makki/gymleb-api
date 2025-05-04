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
@Injectable()
export class SubscriptionService {
  constructor(
    @InjectModel(Subscription.name)
    private subscriptionModel: Model<Subscription>,
    @InjectModel(Gym.name)
    private gymModel: Model<Gym>,
  ) {}
  async create(createSubscriptionDto: CreateSubscriptionDto, manager: Manager) {
    const gym = await this.gymModel.findOne({ owner: manager._id.toString() });
    const subscription = await this.subscriptionModel.create({
      ...createSubscriptionDto,
      gym: gym.id,
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

    const subscription = await this.subscriptionModel.findByIdAndUpdate(
      id,
      updateSubscriptionDto,
    );
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
}
