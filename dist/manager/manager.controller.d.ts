import { Request, Response } from 'express';
import { AuthService } from '../auth/auth.service';
import { RefreshDto } from '../auth/dtos/refresh-token.dto';
import { SuccessMessageReturn } from '../main-classes/success-message-return';
import { CreateManagerDto } from './dtos/create-manager.dto';
import { LoginManagerDto } from './dtos/login-manager.dto';
import { ManagerCreatedWithTokenDto } from './dtos/manager-created-with-token.dto';
import { ManagerCreatedDto } from './dtos/manager-created.dto';
import { UpdateManagerDto } from './dtos/update-manager.sto';
import { Manager } from './manager.entity';
import { ManagerService } from './manager.service';
export declare class ManagerController {
    private readonly ManagerService;
    private readonly AuthService;
    constructor(ManagerService: ManagerService, AuthService: AuthService);
    createManager(body: CreateManagerDto): Promise<ManagerCreatedWithTokenDto>;
    findOne(id: string): Promise<ManagerCreatedDto>;
    login(body: LoginManagerDto, response: Response): Promise<ManagerCreatedWithTokenDto>;
    logout(user: Manager, response: Response): Promise<SuccessMessageReturn>;
    me(user: Manager): Promise<ManagerCreatedDto>;
    getAll(): Promise<ManagerCreatedDto[]>;
    deleteManager(id: string): Promise<SuccessMessageReturn>;
    updateManager(id: string, body: UpdateManagerDto): Promise<ManagerCreatedDto>;
    refresh({ deviceId }: RefreshDto, req: Request, res: Response): Promise<{
        token: string;
    }>;
    clearCookies(res: Response): {
        message: string;
    };
}
