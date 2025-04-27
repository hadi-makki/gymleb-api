import { Types } from 'mongoose';
import { Gym } from '../../gym/entities/gym.entity';
import { User } from '../../user/user.entity';
export declare enum SubscriptionType {
    PERSONAL_TRAINER = "personal_trainer",
    MONTHLY_GYM = "monthly_gym",
    YEARLY_GYM = "yearly_gym",
    DAILY_GYM = "daily_gym"
}
export declare class Subscription {
    title: string;
    type: SubscriptionType;
    price: number;
    duration: number;
    user: User;
    gym: Gym;
}
export declare const SubscriptionSchema: import("mongoose").Schema<Subscription, import("mongoose").Model<Subscription, any, any, any, import("mongoose").Document<unknown, any, Subscription, any> & Subscription & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Subscription, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<Subscription>, {}> & import("mongoose").FlatRecord<Subscription> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
