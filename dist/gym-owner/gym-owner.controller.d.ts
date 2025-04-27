import { GymOwnerService } from './gym-owner.service';
import { CreateGymOwnerDto } from './dto/create-gym-owner.dto';
import { UpdateGymOwnerDto } from './dto/update-gym-owner.dto';
import { Manager } from '../manager/manager.entity';
export declare class GymOwnerController {
    private readonly gymOwnerService;
    constructor(gymOwnerService: GymOwnerService);
    create(createGymOwnerDto: CreateGymOwnerDto): Promise<import("mongoose").Document<unknown, {}, Manager, {}> & Manager & Required<{
        _id: unknown;
    }> & {
        __v: number;
    }>;
    findAll(): Promise<(import("mongoose").Document<unknown, {}, Manager, {}> & Manager & Required<{
        _id: unknown;
    }> & {
        __v: number;
    })[]>;
    findOne(id: string): Promise<import("mongoose").Document<unknown, {}, Manager, {}> & Manager & Required<{
        _id: unknown;
    }> & {
        __v: number;
    }>;
    update(id: string, updateGymOwnerDto: UpdateGymOwnerDto): Promise<import("mongoose").Document<unknown, {}, Manager, {}> & Manager & Required<{
        _id: unknown;
    }> & {
        __v: number;
    }>;
    remove(id: string): Promise<import("mongoose").Document<unknown, {}, Manager, {}> & Manager & Required<{
        _id: unknown;
    }> & {
        __v: number;
    }>;
    getGymOwner(user: Manager): {
        id: string;
        username: string;
        email: string;
        createdAt: Date;
        updatedAt: Date;
        gym: import("../gym/entities/gym.entity").Gym;
    };
}
