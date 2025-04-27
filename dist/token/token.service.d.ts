import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Request, Response } from 'express';
import { Model } from 'mongoose';
import { SuccessMessageReturn } from '../main-classes/success-message-return';
import { Manager } from '../manager/manager.entity';
import { Member } from '../member/entities/member.entity';
import { GenerateTokenDTO } from './token.dto';
import TokenEntity from './token.entity';
import { User } from '../user/user.entity';
export declare class TokenService {
    private readonly tokenRepository;
    private readonly jwtService;
    private readonly configService;
    private readonly memberRepository;
    private readonly managerRepository;
    constructor(tokenRepository: Model<TokenEntity>, jwtService: JwtService, configService: ConfigService, memberRepository: Model<Member>, managerRepository: Model<Manager>);
    generateTokens({ userId, managerId, }: {
        userId: string;
        managerId?: string;
    }): Promise<{
        accessToken: string;
        refreshToken: string;
        refreshExpirationDate: Date;
    }>;
    storeToken(data: GenerateTokenDTO): Promise<TokenEntity>;
    getTokenByAccessToken(token: string): Promise<TokenEntity>;
    deleteTokensByUserId(userId: string): Promise<SuccessMessageReturn>;
    getTokensByUserId(userId: string): Promise<TokenEntity[]>;
    validateJwt(req: Request & {
        user: User | Manager | Member;
    }, res: Response, isMember?: boolean): Promise<{
        sub: string;
        iat: number;
        exp: number;
    }>;
}
