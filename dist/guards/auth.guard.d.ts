import { CanActivate } from '@nestjs/common/interfaces/features/can-activate.interface';
import { ExecutionContext } from '@nestjs/common/interfaces/features/execution-context.interface';
import { Model } from 'mongoose';
import { Manager } from '../manager/manager.entity';
import { TokenService } from '../token/token.service';
import { Member } from '../member/entities/member.entity';
export declare class AuthGuard implements CanActivate {
    private memberRepository;
    private managerRepository;
    private tokenService;
    constructor(memberRepository: Model<Member>, managerRepository: Model<Manager>, tokenService: TokenService);
    canActivate(context: ExecutionContext): Promise<boolean>;
}
