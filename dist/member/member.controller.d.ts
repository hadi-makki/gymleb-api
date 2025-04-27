import { MemberService } from './member.service';
import { CreateMemberDto } from './dto/create-member.dto';
import { UpdateMemberDto } from './dto/update-member.dto';
import { Manager } from '../manager/manager.entity';
import { Member } from './entities/member.entity';
import { LoginMemberDto } from './dto/login-member.dto';
import { Response } from 'express';
export declare class MemberController {
    private readonly memberService;
    constructor(memberService: MemberService);
    create(createMemberDto: CreateMemberDto, manager: Manager): Promise<{
        id: any;
        name: string;
        email: string;
        phone: string;
        gym: import("../gym/entities/gym.entity").Gym;
        subscription: import("../subscription/entities/subscription.entity").Subscription;
        transactions: import("../transactions/transaction.entity").Transaction[];
        hasActiveSubscription: boolean;
    }>;
    login(body: LoginMemberDto, response: Response): Promise<{
        id: any;
        name: string;
        email: string;
        phone: string;
        gym: import("../gym/entities/gym.entity").Gym;
        token: string;
    }>;
    findAll(manager: Manager): Promise<{
        id: any;
        name: string;
        email: string;
        phone: string;
        gym: import("../gym/entities/gym.entity").Gym;
        subscription: import("../subscription/entities/subscription.entity").Subscription;
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
        gym: import("../gym/entities/gym.entity").Gym;
        subscription: import("../subscription/entities/subscription.entity").Subscription;
        transactions: import("../transactions/transaction.entity").Transaction[];
        createdAt: Date;
        updatedAt: Date;
        hasActiveSubscription: boolean;
        currentActiveSubscription: any;
    }>;
    update(id: string, updateMemberDto: UpdateMemberDto): Promise<void>;
    remove(id: string): Promise<{
        message: string;
    }>;
    renewSubscription(id: string): Promise<{
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
        gym: import("../gym/entities/gym.entity").Gym;
        subscription: import("../subscription/entities/subscription.entity").Subscription;
        hasActiveSubscription: boolean;
        currentActiveSubscription: import("../transactions/transaction.entity").Transaction;
    }>;
}
