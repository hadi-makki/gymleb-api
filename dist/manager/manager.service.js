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
exports.ManagerService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const class_validator_1 = require("class-validator");
const mongoose_2 = require("mongoose");
const bad_request_error_1 = require("../error/bad-request-error");
const not_found_error_1 = require("../error/not-found-error");
const returnUser_1 = require("../functions/returnUser");
const token_service_1 = require("../token/token.service");
const manager_entity_1 = require("./manager.entity");
const gym_owner_entity_1 = require("../gym-owner/entities/gym-owner.entity");
let ManagerService = class ManagerService {
    constructor(managerEntity, tokenService, gymOwnerEntity) {
        this.managerEntity = managerEntity;
        this.tokenService = tokenService;
        this.gymOwnerEntity = gymOwnerEntity;
    }
    async createManager(body) {
        const manager = await this.managerEntity.findOne({
            $or: [{ email: body.email }, { username: body.username }],
        });
        if (manager) {
            throw new bad_request_error_1.BadRequestException('User with this email or username already exists');
        }
        const hashedPassword = await manager_entity_1.Manager.hashPassword(body.password);
        const savedManager = await this.managerEntity.create({
            email: body.email.trim().toLowerCase(),
            password: hashedPassword,
            username: body.username.trim(),
            roles: body.roles,
        });
        const token = await this.tokenService.generateTokens({
            managerId: savedManager.id,
            userId: null,
        });
        return {
            ...(0, returnUser_1.returnManager)(savedManager),
            token: token.accessToken,
        };
    }
    async findOne(id) {
        if (!(0, class_validator_1.isMongoId)(id)) {
            throw new bad_request_error_1.BadRequestException('Invalid id');
        }
        const manager = await this.managerEntity.findById(id);
        if (!manager) {
            throw new not_found_error_1.NotFoundException('Manager not found');
        }
        return (0, returnUser_1.returnManager)(manager);
    }
    async login(body) {
        const manager = await this.managerEntity.findOne({
            username: body.username,
        });
        if (!manager) {
            throw new not_found_error_1.NotFoundException('User not found');
        }
        const isPasswordMatch = await manager_entity_1.Manager.isPasswordMatch(body.password, manager.password);
        if (!isPasswordMatch) {
            throw new bad_request_error_1.BadRequestException('Password is incorrect');
        }
        const token = await this.tokenService.generateTokens({
            managerId: manager.id,
            userId: null,
        });
        return {
            ...(0, returnUser_1.returnManager)(manager),
            token: token.accessToken,
        };
    }
    async getAll() {
        const managers = await this.managerEntity.find({});
        return managers.map((manager) => (0, returnUser_1.returnManager)(manager));
    }
    async deleteManager(id) {
        const manager = await this.managerEntity.findById(id);
        if (!manager) {
            throw new not_found_error_1.NotFoundException('Manager not found');
        }
        await this.managerEntity.deleteOne({ id });
        return {
            message: 'Manager deleted successfully',
        };
    }
    async updateManager(id, body) {
        const manager = await this.managerEntity.findById(id);
        if (!manager) {
            throw new not_found_error_1.NotFoundException('Manager not found');
        }
        manager.email = body.email;
        manager.username = body.username;
        await manager.save();
        return (0, returnUser_1.returnManager)(manager);
    }
    async logout(user) {
        await this.tokenService.deleteTokensByUserId(user.id);
        return {
            message: 'Manager logged out successfully',
        };
    }
    async getMe(manager) {
        console.log('manager', manager);
        const checkManager = await this.managerEntity
            .findById(manager.id)
            .populate('gym');
        console.log('checkManager', checkManager);
        if (!checkManager) {
            throw new not_found_error_1.NotFoundException('Manager not found');
        }
        return (0, returnUser_1.returnManager)(checkManager);
    }
};
exports.ManagerService = ManagerService;
exports.ManagerService = ManagerService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(manager_entity_1.Manager.name)),
    __param(2, (0, mongoose_1.InjectModel)(gym_owner_entity_1.GymOwner.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        token_service_1.TokenService,
        mongoose_2.Model])
], ManagerService);
//# sourceMappingURL=manager.service.js.map