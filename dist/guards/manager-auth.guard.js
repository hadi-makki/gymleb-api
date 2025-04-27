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
exports.ManagerAuthGuard = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const manager_entity_1 = require("../manager/manager.entity");
const token_service_1 = require("../token/token.service");
const role_enum_1 = require("../decorators/roles/role.enum");
const Role_1 = require("../decorators/roles/Role");
const core_1 = require("@nestjs/core");
let ManagerAuthGuard = class ManagerAuthGuard {
    constructor(managerRepository, tokenService, reflector) {
        this.managerRepository = managerRepository;
        this.tokenService = tokenService;
        this.reflector = reflector;
    }
    async canActivate(context) {
        console.log('this is the manager auth guard');
        const request = context
            .switchToHttp()
            .getRequest();
        const requiredRoles = this.reflector.getAllAndOverride(Role_1.ROLES_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        if (!requiredRoles) {
            requiredRoles.push(role_enum_1.Role.SuperAdmin);
        }
        const validatedData = await this.tokenService.validateJwt(request, context.switchToHttp().getResponse());
        const userId = validatedData?.sub;
        console.log('userId', userId);
        if (!userId) {
            throw new common_1.UnauthorizedException('Unauthorized');
        }
        const manager = await this.managerRepository
            .findById(userId)
            .populate('roles');
        if (!manager ||
            !requiredRoles.some((role) => manager.roles.includes(role))) {
            throw new common_1.UnauthorizedException('Unauthorized');
        }
        request.user = manager;
        return true;
    }
};
exports.ManagerAuthGuard = ManagerAuthGuard;
exports.ManagerAuthGuard = ManagerAuthGuard = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(manager_entity_1.Manager.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        token_service_1.TokenService,
        core_1.Reflector])
], ManagerAuthGuard);
//# sourceMappingURL=manager-auth.guard.js.map