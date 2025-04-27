import { Document } from 'mongoose';
import { MainEntity } from '../main-classes/mainEntity';
import Token from '../token/token.entity';
import { Transaction } from '../transactions/transaction.entity';
import { PersonalTrainer } from '../personal-trainers/entities/personal-trainer.entity';
import { Gym } from '../gym/entities/gym.entity';
import { Subscription } from '../subscription/entities/subscription.entity';
export type UserDocument = User & Document;
export declare class User extends MainEntity {
    email: string;
    password: string;
    name: string;
    personalTrainer: PersonalTrainer;
    gym: Gym;
    subscription: Subscription;
    tokens: Token[];
    transactions: Transaction[];
    comparePassword(oldPassword: string): Promise<boolean>;
}
export declare const UserSchema: import("mongoose").Schema<User, import("mongoose").Model<User, any, any, any, Document<unknown, any, User, any> & User & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, User, Document<unknown, {}, import("mongoose").FlatRecord<User>, {}> & import("mongoose").FlatRecord<User> & Required<{
    _id: unknown;
}> & {
    __v: number;
}>;
