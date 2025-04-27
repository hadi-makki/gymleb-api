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
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const bad_request_error_1 = require("../error/bad-request-error");
const unauthorized_error_1 = require("../error/unauthorized-error");
const token_entity_1 = require("../token/token.entity");
const token_service_1 = require("../token/token.service");
const user_service_1 = require("../user/user.service");
const helprt_functions_1 = require("../utils/helprt-functions");
let AuthService = class AuthService {
    constructor(tokenService, userService, jwtService, tokenRepository) {
        this.tokenService = tokenService;
        this.userService = userService;
        this.jwtService = jwtService;
        this.tokenRepository = tokenRepository;
    }
    generateTokens(user, deviceId) {
        const payload = { sub: user.id, deviceId };
        const accessToken = this.jwtService.sign(payload, {
            secret: process.env.JWT_ACCESS_SECRET,
            expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
        });
        const refreshToken = this.jwtService.sign(payload, {
            secret: process.env.JWT_REFRESH_SECRET,
            expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
        });
        return { accessToken, refreshToken };
    }
    async login({ email, password }) {
        console.log(email, password);
        const getUser = await this.userService.getUserByEmail(email);
        console.log(getUser);
        if (!getUser) {
            throw new bad_request_error_1.BadRequestException('Wrong Email or Password');
        }
        const isPasswordValid = await getUser.comparePassword(password);
        if (!isPasswordValid) {
            throw new bad_request_error_1.BadRequestException('Wrong Email or Password');
        }
        const generateTokens = await this.tokenService.generateTokens({
            userId: getUser.id,
            managerId: null,
        });
        return { ...(0, helprt_functions_1.returnUser)(getUser), token: generateTokens.accessToken };
    }
    async register({ email, name, password, }) {
        const checkEmail = await this.userService.getUserByEmail(email);
        if (checkEmail) {
            throw new bad_request_error_1.BadRequestException('Email already exists');
        }
        const hashPass = await this.userService.hashPassword(password);
        const newUser = await this.userService.createUser({
            email,
            name,
            password: hashPass,
        });
        const generateTokens = await this.tokenService.generateTokens({
            userId: newUser.id,
            managerId: null,
        });
        return { ...(0, helprt_functions_1.returnUser)(newUser), token: generateTokens.accessToken };
    }
    async test() {
        this.userService.test();
        return 'test';
    }
    async refreshToken(token, deviceId) {
        console.log('this is the incomingToken', token);
        const tokenDoc = await this.tokenRepository.findOne({
            deviceId,
            accessToken: token,
        });
        console.log('this is the foundToken', tokenDoc);
        if (!tokenDoc) {
            throw new unauthorized_error_1.UnauthorizedException('Refresh token not found');
        }
        const payload = this.jwtService.verify(tokenDoc.refreshToken, {
            secret: process.env.JWT_REFRESH_SECRET,
        });
        if (!payload) {
            throw new unauthorized_error_1.UnauthorizedException('Invalid refresh token');
        }
        const user = await this.userService.getUserById(payload.sub);
        if (!user) {
            throw new unauthorized_error_1.UnauthorizedException('User not found');
        }
        const tokens = this.generateTokens(user, deviceId);
        tokenDoc.accessToken = tokens.accessToken;
        await tokenDoc.save();
        return {
            token: tokens.accessToken,
        };
    }
    async validateJwt(req) {
        const token = req.headers.authorization?.split(' ')[1];
        const getTokenFromDb = await this.tokenRepository.findOne({
            accessToken: token,
        });
        if (!token || !getTokenFromDb) {
            throw new unauthorized_error_1.UnauthorizedException('Unauthorized');
        }
        try {
            return this.jwtService.verify(token, {
                secret: process.env.JWT_ACCESS_SECRET,
            });
        }
        catch {
            throw new unauthorized_error_1.UnauthorizedException('Unauthorized');
        }
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __param(3, (0, mongoose_1.InjectModel)(token_entity_1.default.name)),
    __metadata("design:paramtypes", [token_service_1.TokenService,
        user_service_1.UserService,
        jwt_1.JwtService,
        mongoose_2.Model])
], AuthService);
//# sourceMappingURL=auth.service.js.map