import { AuthService } from './auth.service';
import { RegisterDto } from './dtos/request/register.dto';
import { User as UserEntity } from '../user/user.entity';
import { UserCreatedDto } from './dtos/response/user-created.dto';
import { RefreshDto } from './dtos/refresh-token.dto';
import { Request, Response } from 'express';
export declare class AuthController {
    private readonly AuthService;
    constructor(AuthService: AuthService);
    register(registerDto: RegisterDto): Promise<UserCreatedDto>;
    login(loginDto: any): Promise<UserCreatedDto>;
    test(user: UserEntity): Promise<string>;
    refresh({ deviceId }: RefreshDto, req: Request, res: Response): Promise<{
        token: string;
    }>;
    test2(): Promise<string>;
}
