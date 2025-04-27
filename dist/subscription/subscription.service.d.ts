import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';
import { Subscription, SubscriptionType } from './entities/subscription.entity';
import { Model } from 'mongoose';
import { Gym } from '../gym/entities/gym.entity';
import { Manager } from '../manager/manager.entity';
export declare class SubscriptionService {
    private subscriptionModel;
    private gymModel;
    constructor(subscriptionModel: Model<Subscription>, gymModel: Model<Gym>);
    create(createSubscriptionDto: CreateSubscriptionDto, manager: Manager): Promise<import("mongoose").Document<unknown, {}, Subscription, {}> & Subscription & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }>;
    findAll(manager: Manager): Promise<(import("mongoose").Document<unknown, {}, Subscription, {}> & Subscription & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    })[]>;
    findOne(id: string): Promise<import("mongoose").Document<unknown, {}, Subscription, {}> & Subscription & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }>;
    update(id: string, updateSubscriptionDto: UpdateSubscriptionDto): Promise<import("mongoose").Document<unknown, {}, Subscription, {}> & Subscription & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }>;
    remove(id: string): Promise<import("mongoose").Document<unknown, {}, Subscription, {}> & Subscription & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }>;
    getSubscriptionTypes(): Promise<{
        label: string;
        value: SubscriptionType;
    }[]>;
}
