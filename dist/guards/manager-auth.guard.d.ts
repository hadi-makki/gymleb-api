import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Model } from 'mongoose';
import { Manager } from '../manager/manager.entity';
import { TokenService } from '../token/token.service';
import { Reflector } from '@nestjs/core';
export declare class ManagerAuthGuard implements CanActivate {
    private managerRepository;
    private readonly tokenService;
    private readonly reflector;
    constructor(managerRepository: Model<Manager>, tokenService: TokenService, reflector: Reflector);
    canActivate(context: ExecutionContext): Promise<boolean>;
}
