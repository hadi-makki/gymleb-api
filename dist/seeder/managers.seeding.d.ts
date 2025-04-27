import { OnModuleInit } from '@nestjs/common';
import { Model } from 'mongoose';
import { Manager } from '../manager/manager.entity';
export declare class ManagerSeeding implements OnModuleInit {
    private managerRepository;
    constructor(managerRepository: Model<Manager>);
    onModuleInit(): Promise<void>;
    private removeData;
    private seedManagers;
}
