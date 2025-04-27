import { JwtService } from '@nestjs/jwt';
import { Model } from 'mongoose';
import Token from '../token/token.entity';
import { TokenService } from '../token/token.service';
import { User } from '../user/user.entity';
import { UserService } from '../user/user.service';
import { LoginDto } from './dtos/request/login.dto';
import { RegisterDto } from './dtos/request/register.dto';
import { UserCreatedDto } from './dtos/response/user-created.dto';
export declare class AuthService {
    private readonly tokenService;
    private readonly userService;
    private readonly jwtService;
    private readonly tokenRepository;
    constructor(tokenService: TokenService, userService: UserService, jwtService: JwtService, tokenRepository: Model<Token>);
    generateTokens(user: User, deviceId: string): {
        accessToken: string;
        refreshToken: string;
    };
    login({ email, password }: LoginDto): Promise<UserCreatedDto>;
    register({ email, name, password, }: RegisterDto): Promise<UserCreatedDto>;
    test(): Promise<string>;
    refreshToken(token: string, deviceId: string): Promise<{
        token: string;
    }>;
    validateJwt(req: any): Promise<any>;
}
