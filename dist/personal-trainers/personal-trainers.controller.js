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
exports.PersonalTrainersController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const Role_1 = require("../decorators/roles/Role");
const role_enum_1 = require("../decorators/roles/role.enum");
const users_decorator_1 = require("../decorators/users.decorator");
const manager_auth_guard_1 = require("../guards/manager-auth.guard");
const add_personal_trainer_dto_1 = require("./dto/add-personal-trainer.dto");
const create_personal_trainer_dto_1 = require("./dto/create-personal-trainer.dto");
const update_personal_trainer_dto_1 = require("./dto/update-personal-trainer.dto");
const personal_trainer_entity_1 = require("./entities/personal-trainer.entity");
const personal_trainers_service_1 = require("./personal-trainers.service");
let PersonalTrainersController = class PersonalTrainersController {
    constructor(personalTrainersService) {
        this.personalTrainersService = personalTrainersService;
    }
    create(createPersonalTrainerDto) {
        return this.personalTrainersService.create(createPersonalTrainerDto);
    }
    findAll() {
        return this.personalTrainersService.findAll();
    }
    findOne(id) {
        return this.personalTrainersService.findOne(id);
    }
    update(id, updatePersonalTrainerDto) {
        return this.personalTrainersService.update(id, updatePersonalTrainerDto);
    }
    remove(id) {
        return this.personalTrainersService.remove(id);
    }
    findAllUsers(personalTrainer) {
        return this.personalTrainersService.findAllUsers(personalTrainer);
    }
    addUserToPersonalTrainer(addUserToPersonalTrainerDto, personalTrainer) {
        return this.personalTrainersService.addUserToPersonalTrainer(addUserToPersonalTrainerDto, personalTrainer);
    }
};
exports.PersonalTrainersController = PersonalTrainersController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(manager_auth_guard_1.ManagerAuthGuard),
    (0, Role_1.Roles)(role_enum_1.Role.SuperAdmin),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new personal trainer' }),
    (0, swagger_1.ApiBody)({ type: create_personal_trainer_dto_1.CreatePersonalTrainerDto }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'The personal trainer has been successfully created.',
        type: personal_trainer_entity_1.PersonalTrainer,
    }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_personal_trainer_dto_1.CreatePersonalTrainerDto]),
    __metadata("design:returntype", void 0)
], PersonalTrainersController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, common_1.UseGuards)(manager_auth_guard_1.ManagerAuthGuard),
    (0, Role_1.Roles)(role_enum_1.Role.SuperAdmin),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get all personal trainers' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'The personal trainers have been successfully retrieved.',
        type: [personal_trainer_entity_1.PersonalTrainer],
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], PersonalTrainersController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, common_1.UseGuards)(manager_auth_guard_1.ManagerAuthGuard),
    (0, Role_1.Roles)(role_enum_1.Role.SuperAdmin),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get a personal trainer by ID' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'The personal trainer has been successfully retrieved.',
        type: personal_trainer_entity_1.PersonalTrainer,
    }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], PersonalTrainersController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, common_1.UseGuards)(manager_auth_guard_1.ManagerAuthGuard),
    (0, Role_1.Roles)(role_enum_1.Role.SuperAdmin),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Update a personal trainer by ID' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'The personal trainer has been successfully updated.',
        type: personal_trainer_entity_1.PersonalTrainer,
    }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_personal_trainer_dto_1.UpdatePersonalTrainerDto]),
    __metadata("design:returntype", void 0)
], PersonalTrainersController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.UseGuards)(manager_auth_guard_1.ManagerAuthGuard),
    (0, Role_1.Roles)(role_enum_1.Role.SuperAdmin),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Delete a personal trainer by ID' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'The personal trainer has been successfully deleted.',
    }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], PersonalTrainersController.prototype, "remove", null);
__decorate([
    (0, common_1.Get)('users'),
    (0, common_1.UseGuards)(manager_auth_guard_1.ManagerAuthGuard),
    (0, Role_1.Roles)(role_enum_1.Role.SuperAdmin),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get all users' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'The users have been successfully retrieved.',
        type: [users_decorator_1.User],
    }),
    __param(0, (0, users_decorator_1.User)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [personal_trainer_entity_1.PersonalTrainer]),
    __metadata("design:returntype", void 0)
], PersonalTrainersController.prototype, "findAllUsers", null);
__decorate([
    (0, common_1.Post)('add-user'),
    (0, common_1.UseGuards)(manager_auth_guard_1.ManagerAuthGuard),
    (0, Role_1.Roles)(role_enum_1.Role.SuperAdmin),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Add a user to a personal trainer' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'The user has been successfully added to the personal trainer.',
    }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, users_decorator_1.User)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [add_personal_trainer_dto_1.AddPersonalTrainerDto,
        personal_trainer_entity_1.PersonalTrainer]),
    __metadata("design:returntype", void 0)
], PersonalTrainersController.prototype, "addUserToPersonalTrainer", null);
exports.PersonalTrainersController = PersonalTrainersController = __decorate([
    (0, common_1.Controller)('personal-trainers'),
    __metadata("design:paramtypes", [personal_trainers_service_1.PersonalTrainersService])
], PersonalTrainersController);
//# sourceMappingURL=personal-trainers.controller.js.map