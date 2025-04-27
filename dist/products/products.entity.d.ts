import { Document, Types } from 'mongoose';
import { Transaction } from '../transactions/transaction.entity';
export type ProductDocument = Product & Document;
export declare class Product {
    name: string;
    stripeProductId: string;
    price: number;
    transactions: Transaction[];
    maxDurationSeconds: number;
}
export declare const ProductSchema: import("mongoose").Schema<Product, import("mongoose").Model<Product, any, any, any, Document<unknown, any, Product, any> & Product & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Product, Document<unknown, {}, import("mongoose").FlatRecord<Product>, {}> & import("mongoose").FlatRecord<Product> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
