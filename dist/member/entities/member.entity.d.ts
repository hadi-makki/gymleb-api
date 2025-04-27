import { MainEntity } from '../../main-classes/mainEntity';
import { Gym } from '../../gym/entities/gym.entity';
import { Subscription } from '../../subscription/entities/subscription.entity';
import { Transaction } from '../../transactions/transaction.entity';
export declare class Member extends MainEntity {
    name: string;
    username: string;
    email: string;
    phone: string;
    gym: Gym;
    subscription: Subscription;
    transactions: Transaction[];
    passCode: string;
}
export declare const MemberSchema: import("mongoose").Schema<Member, import("mongoose").Model<Member, any, any, any, import("mongoose").Document<unknown, any, Member, any> & Member & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Member, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<Member>, {}> & import("mongoose").FlatRecord<Member> & Required<{
    _id: unknown;
}> & {
    __v: number;
}>;
