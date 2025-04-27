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
exports.GymOwnerController = void 0;
const common_1 = require("@nestjs/common");
const gym_owner_service_1 = require("./gym-owner.service");
const create_gym_owner_dto_1 = require("./dto/create-gym-owner.dto");
const update_gym_owner_dto_1 = require("./dto/update-gym-owner.dto");
const manager_auth_guard_1 = require("../guards/manager-auth.guard");
const swagger_1 = require("@nestjs/swagger");
const gym_owner_entity_1 = require("./entities/gym-owner.entity");
const Role_1 = require("../decorators/roles/Role");
const role_enum_1 = require("../decorators/roles/role.enum");
const manager_entity_1 = require("../manager/manager.entity");
const users_decorator_1 = require("../decorators/users.decorator");
const returnUser_1 = require("../functions/returnUser");
let GymOwnerController = class GymOwnerController {
    constructor(gymOwnerService) {
        this.gymOwnerService = gymOwnerService;
    }
    create(createGymOwnerDto) {
        return this.gymOwnerService.create(createGymOwnerDto);
    }
    findAll() {
        return this.gymOwnerService.findAll();
    }
    findOne(id) {
        return this.gymOwnerService.findOne(id);
    }
    update(id, updateGymOwnerDto) {
        return this.gymOwnerService.update(id, updateGymOwnerDto);
    }
    remove(id) {
        return this.gymOwnerService.remove(id);
    }
    getGymOwner(user) {
        return (0, returnUser_1.returnManager)(user);
    }
};
exports.GymOwnerController = GymOwnerController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(manager_auth_guard_1.ManagerAuthGuard),
    (0, swagger_1.ApiOperation)({ summary: 'Create a gym owner' }),
    (0, swagger_1.ApiOkResponse)({
        description: 'The gym owner has been successfully created.',
        type: gym_owner_entity_1.GymOwner,
    }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_gym_owner_dto_1.CreateGymOwnerDto]),
    __metadata("design:returntype", void 0)
], GymOwnerController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, common_1.UseGuards)(manager_auth_guard_1.ManagerAuthGuard),
    (0, swagger_1.ApiOperation)({ summary: 'Get all gym owners' }),
    (0, swagger_1.ApiOkResponse)({
        description: 'The gym owners have been successfully retrieved.',
        type: [gym_owner_entity_1.GymOwner],
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], GymOwnerController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, common_1.UseGuards)(manager_auth_guard_1.ManagerAuthGuard),
    (0, swagger_1.ApiOperation)({ summary: 'Get a gym owner by id' }),
    (0, swagger_1.ApiOkResponse)({
        description: 'The gym owner has been successfully retrieved.',
        type: gym_owner_entity_1.GymOwner,
    }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], GymOwnerController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, common_1.UseGuards)(manager_auth_guard_1.ManagerAuthGuard),
    (0, swagger_1.ApiOperation)({ summary: 'Update a gym owner by id' }),
    (0, swagger_1.ApiOkResponse)({
        description: 'The gym owner has been successfully updated.',
        type: gym_owner_entity_1.GymOwner,
    }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_gym_owner_dto_1.UpdateGymOwnerDto]),
    __metadata("design:returntype", void 0)
], GymOwnerController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.UseGuards)(manager_auth_guard_1.ManagerAuthGuard),
    (0, swagger_1.ApiOperation)({ summary: 'Delete a gym owner by id' }),
    (0, swagger_1.ApiOkResponse)({
        description: 'The gym owner has been successfully deleted.',
        type: gym_owner_entity_1.GymOwner,
    }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], GymOwnerController.prototype, "remove", null);
__decorate([
    (0, common_1.Get)('me'),
    (0, common_1.UseGuards)(manager_auth_guard_1.ManagerAuthGuard),
    (0, swagger_1.ApiOperation)({ summary: 'Get the gym owner by id' }),
    (0, swagger_1.ApiOkResponse)({
        description: 'The gym owner has been successfully retrieved.',
        type: gym_owner_entity_1.GymOwner,
    }),
    __param(0, (0, users_decorator_1.User)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [manager_entity_1.Manager]),
    __metadata("design:returntype", void 0)
], GymOwnerController.prototype, "getGymOwner", null);
exports.GymOwnerController = GymOwnerController = __decorate([
    (0, common_1.Controller)('gym-owner'),
    (0, Role_1.Roles)(role_enum_1.Role.GymOwner),
    __metadata("design:paramtypes", [gym_owner_service_1.GymOwnerService])
], GymOwnerController);
//# sourceMappingURL=gym-owner.controller.js.map