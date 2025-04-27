import { Model } from 'mongoose';
import { Product } from './products.entity';
export declare class ProductsService {
    private readonly productRepository;
    constructor(productRepository: Model<Product>);
    getProducts(): Promise<(import("mongoose").Document<unknown, {}, Product, {}> & Product & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    })[]>;
    getProductById(id: string): Promise<import("mongoose").Document<unknown, {}, Product, {}> & Product & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }>;
}
