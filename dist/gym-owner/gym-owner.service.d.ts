import { CreateGymOwnerDto } from './dto/create-gym-owner.dto';
import { UpdateGymOwnerDto } from './dto/update-gym-owner.dto';
import { Model } from 'mongoose';
import { Manager } from '../manager/manager.entity';
import { Gym } from '../gym/entities/gym.entity';
export declare class GymOwnerService {
    private readonly gymOwnerModel;
    private readonly gymModel;
    constructor(gymOwnerModel: Model<Manager>, gymModel: Model<Gym>);
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
}
