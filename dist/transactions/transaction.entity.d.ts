import { Document } from 'mongoose';
import { MainEntity } from '../main-classes/mainEntity';
import { Gym } from '../gym/entities/gym.entity';
import { Subscription } from '../subscription/entities/subscription.entity';
import { Member } from '../member/entities/member.entity';
export type TransactionDocument = Transaction & Document;
export declare class Transaction extends MainEntity {
    endDate: string;
    paidAmount: number;
    gym: Gym;
    subscription: Subscription;
    member: Member;
}
export declare const TransactionSchema: import("mongoose").Schema<Transaction, import("mongoose").Model<Transaction, any, any, any, Document<unknown, any, Transaction, any> & Transaction & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Transaction, Document<unknown, {}, import("mongoose").FlatRecord<Transaction>, {}> & import("mongoose").FlatRecord<Transaction> & Required<{
    _id: unknown;
}> & {
    __v: number;
}>;
