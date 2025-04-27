import { OnModuleInit } from '@nestjs/common';
import { Model } from 'mongoose';
import { Gym } from '../gym/entities/gym.entity';
import { Manager } from '../manager/manager.entity';
export declare const Days: {
    day: string;
    isOpen: boolean;
    openingTime: string;
    closingTime: string;
}[];
export declare class GymSeeding implements OnModuleInit {
    private gymRepository;
    private managerRepository;
    constructor(gymRepository: Model<Gym>, managerRepository: Model<Manager>);
    onModuleInit(): Promise<void>;
    private removeData;
    private seedGyms;
}
