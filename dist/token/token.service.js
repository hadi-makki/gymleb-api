"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TokenService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const jwt_1 = require("@nestjs/jwt");
const mongoose_1 = require("@nestjs/mongoose");
const date_fns_1 = require("date-fns");
const mongoose_2 = require("mongoose");
const unauthorized_error_1 = require("../error/unauthorized-error");
const manager_entity_1 = require("../manager/manager.entity");
const member_entity_1 = require("../member/entities/member.entity");
const token_entity_1 = require("./token.entity");
let TokenService = class TokenService {
    constructor(tokenRepository, jwtService, configService, memberRepository, managerRepository) {
        this.tokenRepository = tokenRepository;
        this.jwtService = jwtService;
        this.configService = configService;
        this.memberRepository = memberRepository;
        this.managerRepository = managerRepository;
    }
    async generateTokens({ userId, managerId, }) {
        const refreshExpirationDays = this.configService.get('JWT_REFRESH_EXPIRATION_DAYS');
        const refreshExpirationDate = (0, date_fns_1.addDays)(new Date(), refreshExpirationDays);
        const accessExpirationDays = this.configService.get('JWT_ACCESS_EXPIRATION_MINUTES');
        const accessExpirationDate = (0, date_fns_1.addDays)(new Date(), accessExpirationDays);
        const accessToken = await this.jwtService.signAsync({
            sub: userId || managerId,
        }, {
            secret: this.configService.get('JWT_ACCESS_SECRET'),
            expiresIn: accessExpirationDays + 'd',
        });
        const refreshToken = await this.jwtService.signAsync({
            sub: userId || managerId,
        }, {
            secret: this.configService.get('JWT_REFRESH_SECRET'),
            expiresIn: refreshExpirationDays + 'd',
        });
        await this.storeToken({
            userId,
            managerId,
            accessToken,
            refreshToken,
            accessExpirationDate,
            refreshExpirationDate,
        });
        return {
            accessToken,
            refreshToken,
            refreshExpirationDate,
        };
    }
    async storeToken(data) {
        const checkToken = await this.tokenRepository
            .findOne({
            $or: [
                {
                    member: data?.userId,
                },
                {
                    manager: data?.managerId,
                },
            ],
        })
            .populate('member')
            .populate('manager');
        if (checkToken) {
            console.log('checkToken', checkToken);
            checkToken.refreshToken = data.refreshToken;
            checkToken.refreshExpirationDate = data.refreshExpirationDate;
            checkToken.accessToken = data.accessToken;
            checkToken.accessExpirationDate = data.accessExpirationDate;
            if (data.userId && data.userId !== checkToken.member.id) {
                console.log('data.userId', data.userId);
                const member = await this.memberRepository.findById(data.userId);
                if (!member) {
                    throw new unauthorized_error_1.UnauthorizedException('User not found');
                }
                checkToken.member = member;
            }
            if (data.managerId && data.managerId !== checkToken.manager.id) {
                console.log('data.managerId', data.managerId);
                const manager = await this.managerRepository.findById(data.managerId);
                if (!manager) {
                    throw new unauthorized_error_1.UnauthorizedException('Manager not found');
                }
                checkToken.manager = manager;
            }
            console.log('checkToken', checkToken);
            return await checkToken.save();
        }
        else {
            console.log('data.userId', data.userId);
            const tokenData = {
                ...data,
                ...(data.userId ? { member: data?.userId } : {}),
                ...(data.managerId ? { manager: data?.managerId } : {}),
            };
            console.log('tokenData', tokenData);
            return await this.tokenRepository.create(tokenData);
        }
    }
    async getTokenByAccessToken(token) {
        return await this.tokenRepository.findOne({
            accessToken: token,
        });
    }
    async deleteTokensByUserId(userId) {
        const tokenToDelete = await this.tokenRepository.find({
            member: {
                id: userId,
            },
        });
        if (tokenToDelete) {
            await this.tokenRepository.deleteMany({ member: { id: userId } });
        }
        return {
            message: 'Tokens deleted successfully',
        };
    }
    async getTokensByUserId(userId) {
        return await this.tokenRepository.findOne({
            member: {
                id: userId,
            },
        });
    }
    async validateJwt(req, res, isMember = false) {
        const token = req.cookies.token;
        const memberToken = req.cookies.memberToken;
        const tokenToUse = isMember ? memberToken : token;
        if (!tokenToUse) {
            throw new unauthorized_error_1.UnauthorizedException('Missing Authorization Header');
        }
        try {
            const decodedJwt = (await this.jwtService.verifyAsync(tokenToUse, {
                secret: this.configService.get('JWT_ACCESS_SECRET'),
            }));
            const checkToken = await this.getTokenByAccessToken(tokenToUse);
            if (!checkToken) {
                throw new unauthorized_error_1.UnauthorizedException('Invalid Token');
            }
            return decodedJwt;
        }
        catch (error) {
            throw new unauthorized_error_1.UnauthorizedException('Invalid Token');
        }
    }
};
exports.TokenService = TokenService;
exports.TokenService = TokenService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(token_entity_1.default.name)),
    __param(3, (0, mongoose_1.InjectModel)(member_entity_1.Member.name)),
    __param(4, (0, mongoose_1.InjectModel)(manager_entity_1.Manager.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        jwt_1.JwtService,
        config_1.ConfigService,
        mongoose_2.Model,
        mongoose_2.Model])
], TokenService);
//# sourceMappingURL=token.service.js.map