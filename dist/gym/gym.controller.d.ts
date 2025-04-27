import { GymService } from './gym.service';
import { CreateGymDto } from './dto/create-gym.dto';
import { UpdateGymDto } from './dto/update-gym.dto';
import { Gym } from './entities/gym.entity';
import { Manager } from '../manager/manager.entity';
export declare class GymController {
    private readonly gymService;
    constructor(gymService: GymService);
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
    getGymAnalytics(user: Manager): Promise<{
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
            transactions: import("../transactions/transaction.entity").Transaction[];
            gym: Gym;
            hasActiveSubscription: boolean;
            currentActiveSubscription: import("../transactions/transaction.entity").Transaction;
        }[];
        totalTransactions: number;
        revenueChange: number;
        memberChange: number;
    }>;
    getGymByName(gymName: string): Promise<import("mongoose").Document<unknown, {}, Gym, {}> & Gym & Required<{
        _id: unknown;
    }> & {
        __v: number;
    }>;
    updateGymDay(day: string, user: Manager): Promise<import("mongoose").Document<unknown, {}, Gym, {}> & Gym & Required<{
        _id: unknown;
    }> & {
        __v: number;
    }>;
}
