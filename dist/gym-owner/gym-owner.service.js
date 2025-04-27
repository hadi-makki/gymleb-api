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
exports.GymOwnerService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("mongoose");
const mongoose_2 = require("@nestjs/mongoose");
const manager_entity_1 = require("../manager/manager.entity");
const role_enum_1 = require("../decorators/roles/role.enum");
const gym_entity_1 = require("../gym/entities/gym.entity");
const gym_seeding_1 = require("../seeder/gym.seeding");
let GymOwnerService = class GymOwnerService {
    constructor(gymOwnerModel, gymModel) {
        this.gymOwnerModel = gymOwnerModel;
        this.gymModel = gymModel;
    }
    async create(createGymOwnerDto) {
        const checkGymOwner = await this.gymOwnerModel.findOne({
            email: createGymOwnerDto.email,
        });
        if (checkGymOwner) {
            throw new common_1.BadRequestException('Gym owner already exists');
        }
        const gymOwner = await this.gymOwnerModel.create({
            name: createGymOwnerDto.name,
            email: createGymOwnerDto.email,
            password: await manager_entity_1.Manager.hashPassword(createGymOwnerDto.password),
            address: createGymOwnerDto.address,
            phone: createGymOwnerDto.phone,
            username: createGymOwnerDto.name.toLowerCase().split(' ').join(''),
            roles: [role_enum_1.Role.GymOwner],
        });
        const checkGym = await this.gymModel.create({
            name: createGymOwnerDto.name,
            address: createGymOwnerDto.address,
            phone: createGymOwnerDto.phone,
            email: createGymOwnerDto.email,
            password: createGymOwnerDto.password,
            openingDays: gym_seeding_1.Days,
            owner: gymOwner.id,
        });
        gymOwner.gym = checkGym.id;
        await gymOwner.save();
        return gymOwner;
    }
    async findAll() {
        const gymOwners = await this.gymOwnerModel.find();
        return gymOwners;
    }
    async findOne(id) {
        const gymOwner = await this.gymOwnerModel.findById(id);
        if (!gymOwner) {
            throw new common_1.NotFoundException('Gym owner not found');
        }
        return gymOwner;
    }
    async update(id, updateGymOwnerDto) {
        const gymOwner = await this.gymOwnerModel.findByIdAndUpdate(id, updateGymOwnerDto, {
            new: true,
        });
        if (!gymOwner) {
            throw new common_1.NotFoundException('Gym owner not found');
        }
        return gymOwner;
    }
    async remove(id) {
        const gymOwner = await this.gymOwnerModel.findByIdAndDelete(id);
        if (!gymOwner) {
            throw new common_1.NotFoundException('Gym owner not found');
        }
        return gymOwner;
    }
};
exports.GymOwnerService = GymOwnerService;
exports.GymOwnerService = GymOwnerService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_2.InjectModel)(manager_entity_1.Manager.name)),
    __param(1, (0, mongoose_2.InjectModel)(gym_entity_1.Gym.name)),
    __metadata("design:paramtypes", [mongoose_1.Model,
        mongoose_1.Model])
], GymOwnerService);
//# sourceMappingURL=gym-owner.service.js.map