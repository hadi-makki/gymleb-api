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
exports.AuthController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const auth_service_1 = require("./auth.service");
const register_dto_1 = require("./dtos/request/register.dto");
const api_responses_decorator_1 = require("../error/api-responses.decorator");
const auth_guard_1 = require("../guards/auth.guard");
const users_decorator_1 = require("../decorators/users.decorator");
const user_entity_1 = require("../user/user.entity");
const user_created_dto_1 = require("./dtos/response/user-created.dto");
const refresh_token_out_dto_1 = require("./dtos/out/refresh-token-out.dto");
const refresh_token_dto_1 = require("./dtos/refresh-token.dto");
const constants_1 = require("../utils/constants");
let AuthController = class AuthController {
    constructor(AuthService) {
        this.AuthService = AuthService;
    }
    async register(registerDto) {
        return this.AuthService.register(registerDto);
    }
    async login(loginDto) {
        return await this.AuthService.login(loginDto);
    }
    async test(user) {
        console.log(user);
        return this.AuthService.test();
    }
    async refresh({ deviceId }, req, res) {
        const token = req.headers.token;
        console.log('token', token);
        console.log('headers', req.headers);
        const refreshToken = await this.AuthService.refreshToken(token, deviceId);
        res.cookie('token', refreshToken.token, constants_1.cookieOptions);
        return refreshToken;
    }
    async test2() {
        return this.AuthService.test();
    }
};
exports.AuthController = AuthController;
__decorate([
    (0, common_1.Post)('register'),
    (0, swagger_1.ApiBody)({
        type: register_dto_1.RegisterDto,
    }),
    (0, swagger_1.ApiCreatedResponse)({
        description: 'User logged in',
        type: user_created_dto_1.UserCreatedDto,
    }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [register_dto_1.RegisterDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "register", null);
__decorate([
    (0, common_1.Post)('login'),
    (0, swagger_1.ApiCreatedResponse)({
        description: 'User logged in',
        type: user_created_dto_1.UserCreatedDto,
    }),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "login", null);
__decorate([
    (0, common_1.Get)('test'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard),
    __param(0, (0, users_decorator_1.User)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [user_entity_1.User]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "test", null);
__decorate([
    (0, common_1.Post)('refresh'),
    (0, swagger_1.ApiCreatedResponse)({
        description: 'Token refreshed successfully',
        type: refresh_token_out_dto_1.RefreshTokenOutDto,
    }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [refresh_token_dto_1.RefreshDto, Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "refresh", null);
__decorate([
    (0, common_1.Get)('test2'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "test2", null);
exports.AuthController = AuthController = __decorate([
    (0, common_1.Controller)('auth'),
    (0, swagger_1.ApiTags)('auth'),
    (0, api_responses_decorator_1.ApiBadRequestResponse)(),
    (0, api_responses_decorator_1.ApiInternalServerErrorResponse)(),
    (0, api_responses_decorator_1.ApiNotFoundResponse)(),
    __metadata("design:paramtypes", [auth_service_1.AuthService])
], AuthController);
//# sourceMappingURL=auth.controller.js.map