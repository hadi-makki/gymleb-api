import { Model } from 'mongoose';
import { SuccessMessageReturn } from '../main-classes/success-message-return';
import { TokenService } from '../token/token.service';
import { CreateManagerDto } from './dtos/create-manager.dto';
import { LoginManagerDto } from './dtos/login-manager.dto';
import { ManagerCreatedWithTokenDto } from './dtos/manager-created-with-token.dto';
import { ManagerCreatedDto } from './dtos/manager-created.dto';
import { UpdateManagerDto } from './dtos/update-manager.sto';
import { Manager } from './manager.entity';
import { GymOwner } from '../gym-owner/entities/gym-owner.entity';
export declare class ManagerService {
    private readonly managerEntity;
    private readonly tokenService;
    private readonly gymOwnerEntity;
    constructor(managerEntity: Model<Manager>, tokenService: TokenService, gymOwnerEntity: Model<GymOwner>);
    createManager(body: CreateManagerDto): Promise<ManagerCreatedWithTokenDto>;
    findOne(id: string): Promise<ManagerCreatedDto>;
    login(body: LoginManagerDto): Promise<ManagerCreatedWithTokenDto>;
    getAll(): Promise<ManagerCreatedDto[]>;
    deleteManager(id: string): Promise<SuccessMessageReturn>;
    updateManager(id: string, body: UpdateManagerDto): Promise<ManagerCreatedDto>;
    logout(user: Manager): Promise<SuccessMessageReturn>;
    getMe(manager: Manager): Promise<ManagerCreatedDto>;
}
