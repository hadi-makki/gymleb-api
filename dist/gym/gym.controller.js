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
exports.GymController = void 0;
const common_1 = require("@nestjs/common");
const gym_service_1 = require("./gym.service");
const create_gym_dto_1 = require("./dto/create-gym.dto");
const update_gym_dto_1 = require("./dto/update-gym.dto");
const manager_auth_guard_1 = require("../guards/manager-auth.guard");
const swagger_1 = require("@nestjs/swagger");
const gym_entity_1 = require("./entities/gym.entity");
const Role_1 = require("../decorators/roles/Role");
const role_enum_1 = require("../decorators/roles/role.enum");
const users_decorator_1 = require("../decorators/users.decorator");
const manager_entity_1 = require("../manager/manager.entity");
let GymController = class GymController {
    constructor(gymService) {
        this.gymService = gymService;
    }
    create(createGymDto) {
        return this.gymService.create(createGymDto);
    }
    findAll() {
        return this.gymService.findAll();
    }
    findOne(id) {
        return this.gymService.findOne(id);
    }
    update(id, updateGymDto) {
        return this.gymService.update(id, updateGymDto);
    }
    remove(id) {
        return this.gymService.remove(id);
    }
    getGymAnalytics(user) {
        return this.gymService.getGymAnalytics(user);
    }
    getGymByName(gymName) {
        return this.gymService.getGymByGymName(gymName);
    }
    updateGymDay(day, user) {
        return this.gymService.updateGymDay(day, user);
    }
};
exports.GymController = GymController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(manager_auth_guard_1.ManagerAuthGuard),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new gym' }),
    (0, swagger_1.ApiOkResponse)({
        description: 'The gym has been successfully created.',
        type: gym_entity_1.Gym,
    }),
    (0, swagger_1.ApiBody)({ type: create_gym_dto_1.CreateGymDto }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_gym_dto_1.CreateGymDto]),
    __metadata("design:returntype", void 0)
], GymController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, common_1.UseGuards)(manager_auth_guard_1.ManagerAuthGuard),
    (0, swagger_1.ApiOperation)({ summary: 'Get all gyms' }),
    (0, swagger_1.ApiOkResponse)({
        description: 'The gyms have been successfully retrieved.',
        type: [gym_entity_1.Gym],
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], GymController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, common_1.UseGuards)(manager_auth_guard_1.ManagerAuthGuard),
    (0, swagger_1.ApiOperation)({ summary: 'Get a gym by id' }),
    (0, swagger_1.ApiOkResponse)({
        description: 'The gym has been successfully retrieved.',
        type: gym_entity_1.Gym,
    }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], GymController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, common_1.UseGuards)(manager_auth_guard_1.ManagerAuthGuard),
    (0, swagger_1.ApiOperation)({ summary: 'Update a gym by id' }),
    (0, swagger_1.ApiOkResponse)({
        description: 'The gym has been successfully updated.',
        type: gym_entity_1.Gym,
    }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_gym_dto_1.UpdateGymDto]),
    __metadata("design:returntype", void 0)
], GymController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.UseGuards)(manager_auth_guard_1.ManagerAuthGuard),
    (0, swagger_1.ApiOperation)({ summary: 'Delete a gym by id' }),
    (0, swagger_1.ApiOkResponse)({
        description: 'The gym has been successfully deleted.',
        type: gym_entity_1.Gym,
    }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], GymController.prototype, "remove", null);
__decorate([
    (0, common_1.Get)('analytics'),
    (0, common_1.UseGuards)(manager_auth_guard_1.ManagerAuthGuard),
    (0, swagger_1.ApiOperation)({ summary: 'Get gym analytics' }),
    __param(0, (0, users_decorator_1.User)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [manager_entity_1.Manager]),
    __metadata("design:returntype", void 0)
], GymController.prototype, "getGymAnalytics", null);
__decorate([
    (0, common_1.Get)('by-name/:gymName'),
    (0, swagger_1.ApiOperation)({ summary: 'Get gym by name' }),
    (0, swagger_1.ApiOkResponse)({
        description: 'The gym has been successfully retrieved.',
        type: gym_entity_1.Gym,
    }),
    __param(0, (0, common_1.Param)('gymName')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], GymController.prototype, "getGymByName", null);
__decorate([
    (0, common_1.Patch)('day/:day'),
    (0, common_1.UseGuards)(manager_auth_guard_1.ManagerAuthGuard),
    (0, swagger_1.ApiOperation)({ summary: 'Update a gym day' }),
    (0, swagger_1.ApiOkResponse)({
        description: 'The gym day has been successfully updated.',
        type: gym_entity_1.Gym,
    }),
    __param(0, (0, common_1.Param)('day')),
    __param(1, (0, users_decorator_1.User)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, manager_entity_1.Manager]),
    __metadata("design:returntype", void 0)
], GymController.prototype, "updateGymDay", null);
exports.GymController = GymController = __decorate([
    (0, common_1.Controller)('gym'),
    (0, Role_1.Roles)(role_enum_1.Role.GymOwner),
    __metadata("design:paramtypes", [gym_service_1.GymService])
], GymController);
//# sourceMappingURL=gym.controller.js.map