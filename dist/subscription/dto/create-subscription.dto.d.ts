import { SubscriptionType } from '../entities/subscription.entity';
export declare class CreateSubscriptionDto {
    title: string;
    type: SubscriptionType;
    price: number;
    duration: number;
}
