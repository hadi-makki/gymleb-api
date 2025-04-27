import { CreateGymDto } from './dto/create-gym.dto';
import { UpdateGymDto } from './dto/update-gym.dto';
import { Gym } from './entities/gym.entity';
import { GymOwner } from '../gym-owner/entities/gym-owner.entity';
import { Model } from 'mongoose';
import { Transaction } from '../transactions/transaction.entity';
import { Member } from '../member/entities/member.entity';
import { Manager } from '../manager/manager.entity';
export declare class GymService {
    private gymModel;
    private gymOwnerModel;
    private transactionModel;
    private memberModel;
    constructor(gymModel: Model<Gym>, gymOwnerModel: Model<GymOwner>, transactionModel: Model<Transaction>, memberModel: Model<Member>);
    create(createGymDto: CreateGymDto): Promise<import("mongoose").Document<unknown, {}, Gym, {}> & Gym & Required<{
        _id: unknown;
    }> & {
        __v: number;
    }>;
    findAll(): Promise<(import("mongoose").Document<unknown, {}, Gym, {}> & Gym & Required<{
        _id: unknown;
    }> & {
        __v: number;
    })[]>;
    findOne(id: string): Promise<import("mongoose").Document<unknown, {}, Gym, {}> & Gym & Required<{
        _id: unknown;
    }> & {
        __v: number;
    }>;
    update(id: string, updateGymDto: UpdateGymDto): Promise<import("mongoose").Document<unknown, {}, Gym, {}> & Gym & Required<{
        _id: unknown;
    }> & {
        __v: number;
    }>;
    remove(id: string): Promise<import("mongoose").Document<unknown, {}, Gym, {}> & Gym & Required<{
        _id: unknown;
    }> & {
        __v: number;
    }>;
    getGymAnalytics(manager: Manager): Promise<{
        totalRevenue: number;
        totalMembers: number;
        members: {
            id: any;
            name: string;
            email: string;
            phone: string;
            createdAt: Date;
            updatedAt: Date;
            subscription: import("../subscription/entities/subscription.entity").Subscription;
            transactions: Transaction[];
            gym: Gym;
            hasActiveSubscription: boolean;
            currentActiveSubscription: Transaction;
        }[];
        totalTransactions: number;
        revenueChange: number;
        memberChange: number;
    }>;
    getGymByGymName(gymName: string): Promise<import("mongoose").Document<unknown, {}, Gym, {}> & Gym & Required<{
        _id: unknown;
    }> & {
        __v: number;
    }>;
    updateGymDay(dayToUpdate: string, manager: Manager): Promise<import("mongoose").Document<unknown, {}, Gym, {}> & Gym & Required<{
        _id: unknown;
    }> & {
        __v: number;
    }>;
}
