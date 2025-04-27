import { CreateMemberDto } from './dto/create-member.dto';
import { UpdateMemberDto } from './dto/update-member.dto';
import { Model } from 'mongoose';
import { Member } from './entities/member.entity';
import { Manager } from '../manager/manager.entity';
import { Gym } from '../gym/entities/gym.entity';
import { Subscription } from '../subscription/entities/subscription.entity';
import { TransactionsService } from '../transactions/transactions.service';
import { LoginMemberDto } from './dto/login-member.dto';
import { TokenService } from '../token/token.service';
export declare class MemberService {
    private memberModel;
    private gymModel;
    private subscriptionModel;
    private readonly transationService;
    private readonly tokenService;
    constructor(memberModel: Model<Member>, gymModel: Model<Gym>, subscriptionModel: Model<Subscription>, transationService: TransactionsService, tokenService: TokenService);
    create(createMemberDto: CreateMemberDto, manager: Manager): Promise<{
        id: any;
        name: string;
        email: string;
        phone: string;
        gym: Gym;
        subscription: Subscription;
        transactions: import("../transactions/transaction.entity").Transaction[];
        hasActiveSubscription: boolean;
    }>;
    loginMember(loginMemberDto: LoginMemberDto): Promise<{
        id: any;
        name: string;
        email: string;
        phone: string;
        gym: Gym;
        token: string;
    }>;
    findAll(manager: Manager): Promise<{
        id: any;
        name: string;
        email: string;
        phone: string;
        gym: Gym;
        subscription: Subscription;
        transactions: import("../transactions/transaction.entity").Transaction[];
        createdAt: Date;
        updatedAt: Date;
        hasActiveSubscription: boolean;
        currentActiveSubscription: import("../transactions/transaction.entity").Transaction;
    }[]>;
    findOne(id: string): Promise<{
        id: any;
        name: string;
        email: string;
        phone: string;
        gym: Gym;
        subscription: Subscription;
        transactions: import("../transactions/transaction.entity").Transaction[];
        createdAt: Date;
        updatedAt: Date;
        hasActiveSubscription: boolean;
        currentActiveSubscription: any;
    }>;
    renewSubscription(id: string): Promise<{
        message: string;
    }>;
    update(id: string, updateMemberDto: UpdateMemberDto): Promise<void>;
    remove(id: string): Promise<{
        message: string;
    }>;
    getExpiredMembers(manager: Manager): Promise<(import("mongoose").Document<unknown, {}, Member, {}> & Member & Required<{
        _id: unknown;
    }> & {
        __v: number;
    })[]>;
    getMe(member: Member): Promise<{
        id: any;
        name: string;
        email: string;
        phone: string;
        gym: Gym;
        subscription: Subscription;
        hasActiveSubscription: boolean;
        currentActiveSubscription: import("../transactions/transaction.entity").Transaction;
    }>;
}
