import { SubscriptionService } from './subscription.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';
import { Manager } from '../manager/manager.entity';
export declare class SubscriptionController {
    private readonly subscriptionService;
    constructor(subscriptionService: SubscriptionService);
    create(createSubscriptionDto: CreateSubscriptionDto, manager: Manager): Promise<import("mongoose").Document<unknown, {}, import("./entities/subscription.entity").Subscription, {}> & import("./entities/subscription.entity").Subscription & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }>;
    findAll(manager: Manager): Promise<(import("mongoose").Document<unknown, {}, import("./entities/subscription.entity").Subscription, {}> & import("./entities/subscription.entity").Subscription & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    })[]>;
    findOne(id: string): Promise<import("mongoose").Document<unknown, {}, import("./entities/subscription.entity").Subscription, {}> & import("./entities/subscription.entity").Subscription & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }>;
    update(id: string, updateSubscriptionDto: UpdateSubscriptionDto): Promise<import("mongoose").Document<unknown, {}, import("./entities/subscription.entity").Subscription, {}> & import("./entities/subscription.entity").Subscription & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }>;
    remove(id: string): Promise<import("mongoose").Document<unknown, {}, import("./entities/subscription.entity").Subscription, {}> & import("./entities/subscription.entity").Subscription & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }>;
    getSubscriptionTypes(): Promise<{
        label: string;
        value: import("./entities/subscription.entity").SubscriptionType;
    }[]>;
}
