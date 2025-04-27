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
exports.MemberController = void 0;
const common_1 = require("@nestjs/common");
const member_service_1 = require("./member.service");
const create_member_dto_1 = require("./dto/create-member.dto");
const update_member_dto_1 = require("./dto/update-member.dto");
const users_decorator_1 = require("../decorators/users.decorator");
const manager_entity_1 = require("../manager/manager.entity");
const Role_1 = require("../decorators/roles/Role");
const role_enum_1 = require("../decorators/roles/role.enum");
const manager_auth_guard_1 = require("../guards/manager-auth.guard");
const auth_guard_1 = require("../guards/auth.guard");
const member_entity_1 = require("./entities/member.entity");
const login_member_dto_1 = require("./dto/login-member.dto");
let MemberController = class MemberController {
    constructor(memberService) {
        this.memberService = memberService;
    }
    async create(createMemberDto, manager) {
        return await this.memberService.create(createMemberDto, manager);
    }
    async login(body, response) {
        console.log('body', body);
        const loginMember = await this.memberService.loginMember(body);
        response.cookie('memberToken', loginMember.token, {
            httpOnly: true,
            secure: true,
            sameSite: 'none',
            path: '/',
            maxAge: 1000 * 60 * 60 * 24 * 30,
        });
        return loginMember;
    }
    async findAll(manager) {
        return await this.memberService.findAll(manager);
    }
    async findOne(id) {
        return await this.memberService.findOne(id);
    }
    async update(id, updateMemberDto) {
        return await this.memberService.update(id, updateMemberDto);
    }
    async remove(id) {
        return await this.memberService.remove(id);
    }
    async renewSubscription(id) {
        return await this.memberService.renewSubscription(id);
    }
    async getExpiredMembers(manager) {
        return await this.memberService.getExpiredMembers(manager);
    }
    async getMe(member) {
        return await this.memberService.getMe(member);
    }
};
exports.MemberController = MemberController;
__decorate([
    (0, common_1.Post)(),
    (0, Role_1.Roles)(role_enum_1.Role.GymOwner),
    (0, common_1.UseGuards)(manager_auth_guard_1.ManagerAuthGuard),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, users_decorator_1.User)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_member_dto_1.CreateMemberDto,
        manager_entity_1.Manager]),
    __metadata("design:returntype", Promise)
], MemberController.prototype, "create", null);
__decorate([
    (0, common_1.Post)('login'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [login_member_dto_1.LoginMemberDto, Object]),
    __metadata("design:returntype", Promise)
], MemberController.prototype, "login", null);
__decorate([
    (0, common_1.Get)(),
    (0, Role_1.Roles)(role_enum_1.Role.GymOwner),
    (0, common_1.UseGuards)(manager_auth_guard_1.ManagerAuthGuard),
    __param(0, (0, users_decorator_1.User)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [manager_entity_1.Manager]),
    __metadata("design:returntype", Promise)
], MemberController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, Role_1.Roles)(role_enum_1.Role.GymOwner),
    (0, common_1.UseGuards)(manager_auth_guard_1.ManagerAuthGuard),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], MemberController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, Role_1.Roles)(role_enum_1.Role.GymOwner),
    (0, common_1.UseGuards)(manager_auth_guard_1.ManagerAuthGuard),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_member_dto_1.UpdateMemberDto]),
    __metadata("design:returntype", Promise)
], MemberController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, Role_1.Roles)(role_enum_1.Role.GymOwner),
    (0, common_1.UseGuards)(manager_auth_guard_1.ManagerAuthGuard),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], MemberController.prototype, "remove", null);
__decorate([
    (0, common_1.Post)(':id/renew'),
    (0, Role_1.Roles)(role_enum_1.Role.GymOwner),
    (0, common_1.UseGuards)(manager_auth_guard_1.ManagerAuthGuard),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], MemberController.prototype, "renewSubscription", null);
__decorate([
    (0, common_1.Get)('expired'),
    (0, Role_1.Roles)(role_enum_1.Role.GymOwner),
    (0, common_1.UseGuards)(manager_auth_guard_1.ManagerAuthGuard),
    __param(0, (0, users_decorator_1.User)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [manager_entity_1.Manager]),
    __metadata("design:returntype", Promise)
], MemberController.prototype, "getExpiredMembers", null);
__decorate([
    (0, common_1.Get)('me'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard),
    __param(0, (0, users_decorator_1.User)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [member_entity_1.Member]),
    __metadata("design:returntype", Promise)
], MemberController.prototype, "getMe", null);
exports.MemberController = MemberController = __decorate([
    (0, common_1.Controller)('member'),
    __metadata("design:paramtypes", [member_service_1.MemberService])
], MemberController);
//# sourceMappingURL=member.controller.js.map