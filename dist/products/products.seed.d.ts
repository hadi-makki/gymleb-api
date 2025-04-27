import { OnModuleInit } from '@nestjs/common';
import { Model } from 'mongoose';
import { Product } from './products.entity';
export declare class SubscriptionPlanSeeding implements OnModuleInit {
    private productRepository;
    constructor(productRepository: Model<Product>);
    onModuleInit(): Promise<void>;
    private seedproducts;
}
