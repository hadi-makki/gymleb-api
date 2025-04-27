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
exports.ManagerController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const auth_service_1 = require("../auth/auth.service");
const refresh_token_out_dto_1 = require("../auth/dtos/out/refresh-token-out.dto");
const refresh_token_dto_1 = require("../auth/dtos/refresh-token.dto");
const Role_1 = require("../decorators/roles/Role");
const role_enum_1 = require("../decorators/roles/role.enum");
const users_decorator_1 = require("../decorators/users.decorator");
const api_responses_decorator_1 = require("../error/api-responses.decorator");
const manager_auth_guard_1 = require("../guards/manager-auth.guard");
const success_message_return_1 = require("../main-classes/success-message-return");
const constants_1 = require("../utils/constants");
const create_manager_dto_1 = require("./dtos/create-manager.dto");
const login_manager_dto_1 = require("./dtos/login-manager.dto");
const manager_created_with_token_dto_1 = require("./dtos/manager-created-with-token.dto");
const manager_created_dto_1 = require("./dtos/manager-created.dto");
const update_manager_sto_1 = require("./dtos/update-manager.sto");
const manager_entity_1 = require("./manager.entity");
const manager_service_1 = require("./manager.service");
let ManagerController = class ManagerController {
    constructor(ManagerService, AuthService) {
        this.ManagerService = ManagerService;
        this.AuthService = AuthService;
    }
    createManager(body) {
        return this.ManagerService.createManager(body);
    }
    findOne(id) {
        return this.ManagerService.findOne(id);
    }
    async login(body, response) {
        const loginManager = await this.ManagerService.login(body);
        response.cookie('token', loginManager.token, {
            httpOnly: true,
            secure: true,
            sameSite: 'none',
            path: '/',
            maxAge: 1000 * 60 * 60 * 24 * 30,
        });
        return loginManager;
    }
    async logout(user, response) {
        response.clearCookie('token');
        return this.ManagerService.logout(user);
    }
    async me(user) {
        console.log('user', user);
        return this.ManagerService.getMe(user);
    }
    getAll() {
        return this.ManagerService.getAll();
    }
    deleteManager(id) {
        return this.ManagerService.deleteManager(id);
    }
    updateManager(id, body) {
        return this.ManagerService.updateManager(id, body);
    }
    async refresh({ deviceId }, req, res) {
        const token = req.headers.token;
        const refreshToken = await this.AuthService.refreshToken(token, deviceId);
        res.cookie('token', refreshToken.token, constants_1.cookieOptions);
        return refreshToken;
    }
    clearCookies(res) {
        res.clearCookie('token', {
            httpOnly: true,
            secure: true,
            sameSite: 'none',
            path: '*',
        });
        return { message: 'Cookies cleared' };
    }
};
exports.ManagerController = ManagerController;
__decorate([
    (0, common_1.Post)('/create'),
    (0, common_1.UseGuards)(manager_auth_guard_1.ManagerAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, api_responses_decorator_1.ApiBadRequestResponse)(),
    (0, api_responses_decorator_1.ApiUnauthorizedResponse)(),
    (0, swagger_1.ApiCreatedResponse)({
        description: 'Manager created successfully',
        type: manager_created_dto_1.ManagerCreatedDto,
    }),
    (0, Role_1.Roles)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_manager_dto_1.CreateManagerDto]),
    __metadata("design:returntype", void 0)
], ManagerController.prototype, "createManager", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, common_1.UseGuards)(manager_auth_guard_1.ManagerAuthGuard),
    (0, Role_1.Roles)(),
    (0, swagger_1.ApiBearerAuth)(),
    (0, api_responses_decorator_1.ApiBadRequestResponse)(),
    (0, api_responses_decorator_1.ApiUnauthorizedResponse)(),
    (0, swagger_1.ApiOkResponse)({ type: manager_entity_1.Manager }),
    (0, api_responses_decorator_1.ApiNotFoundResponse)('Manager not found'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ManagerController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)('login'),
    (0, api_responses_decorator_1.ApiBadRequestResponse)(),
    (0, swagger_1.ApiCreatedResponse)({
        description: 'Manager logged in successfully',
        type: manager_created_with_token_dto_1.ManagerCreatedWithTokenDto,
    }),
    (0, api_responses_decorator_1.ApiNotFoundResponse)('Manager not found'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [login_manager_dto_1.LoginManagerDto, Object]),
    __metadata("design:returntype", Promise)
], ManagerController.prototype, "login", null);
__decorate([
    (0, common_1.Post)('logout'),
    (0, common_1.UseGuards)(manager_auth_guard_1.ManagerAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, api_responses_decorator_1.ApiBadRequestResponse)(),
    (0, api_responses_decorator_1.ApiUnauthorizedResponse)(),
    (0, swagger_1.ApiOkResponse)({ type: success_message_return_1.SuccessMessageReturn }),
    __param(0, (0, users_decorator_1.User)()),
    __param(1, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [manager_entity_1.Manager, Object]),
    __metadata("design:returntype", Promise)
], ManagerController.prototype, "logout", null);
__decorate([
    (0, common_1.Get)('get/me'),
    (0, common_1.UseGuards)(manager_auth_guard_1.ManagerAuthGuard),
    (0, Role_1.Roles)(role_enum_1.Role.GymOwner),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOkResponse)({ type: manager_entity_1.Manager }),
    (0, api_responses_decorator_1.ApiBadRequestResponse)(),
    (0, api_responses_decorator_1.ApiUnauthorizedResponse)(),
    __param(0, (0, users_decorator_1.User)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [manager_entity_1.Manager]),
    __metadata("design:returntype", Promise)
], ManagerController.prototype, "me", null);
__decorate([
    (0, common_1.Get)(),
    (0, common_1.UseGuards)(manager_auth_guard_1.ManagerAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, api_responses_decorator_1.ApiBadRequestResponse)(),
    (0, api_responses_decorator_1.ApiUnauthorizedResponse)(),
    (0, swagger_1.ApiOkResponse)({ type: [manager_entity_1.Manager] }),
    (0, Role_1.Roles)(role_enum_1.Role.ReadPersonalTrainers),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], ManagerController.prototype, "getAll", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.UseGuards)(manager_auth_guard_1.ManagerAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, api_responses_decorator_1.ApiBadRequestResponse)(),
    (0, api_responses_decorator_1.ApiUnauthorizedResponse)(),
    (0, swagger_1.ApiOkResponse)({ type: success_message_return_1.SuccessMessageReturn }),
    (0, Role_1.Roles)(),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ManagerController.prototype, "deleteManager", null);
__decorate([
    (0, common_1.Patch)('/update/:id'),
    (0, common_1.UseGuards)(manager_auth_guard_1.ManagerAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, api_responses_decorator_1.ApiBadRequestResponse)(),
    (0, api_responses_decorator_1.ApiUnauthorizedResponse)(),
    (0, api_responses_decorator_1.ApiNotFoundResponse)('Manager not found'),
    (0, swagger_1.ApiOkResponse)({ type: manager_entity_1.Manager }),
    (0, Role_1.Roles)(),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_manager_sto_1.UpdateManagerDto]),
    __metadata("design:returntype", void 0)
], ManagerController.prototype, "updateManager", null);
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
], ManagerController.prototype, "refresh", null);
__decorate([
    (0, common_1.Get)('clear-cookies'),
    __param(0, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ManagerController.prototype, "clearCookies", null);
exports.ManagerController = ManagerController = __decorate([
    (0, common_1.Controller)('manager'),
    (0, swagger_1.ApiTags)('Manager'),
    (0, api_responses_decorator_1.ApiInternalServerErrorResponse)(),
    __metadata("design:paramtypes", [manager_service_1.ManagerService,
        auth_service_1.AuthService])
], ManagerController);
//# sourceMappingURL=manager.controller.js.map