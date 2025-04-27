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
exports.PersonalTrainersService = void 0;
const common_1 = require("@nestjs/common");
const personal_trainer_entity_1 = require("./entities/personal-trainer.entity");
const mongoose_1 = require("mongoose");
const mongoose_2 = require("@nestjs/mongoose");
const role_enum_1 = require("../decorators/roles/role.enum");
const user_entity_1 = require("../user/user.entity");
const not_found_error_1 = require("../error/not-found-error");
let PersonalTrainersService = class PersonalTrainersService {
    constructor(personalTrainerEntity, userEntity) {
        this.personalTrainerEntity = personalTrainerEntity;
        this.userEntity = userEntity;
    }
    async create(createPersonalTrainerDto) {
        const personalTrainer = await this.personalTrainerEntity.create({
            name: createPersonalTrainerDto.name,
            email: createPersonalTrainerDto.email,
            password: createPersonalTrainerDto.password,
            users: createPersonalTrainerDto.users,
            roles: [role_enum_1.Role.ReadUsers],
        });
        return personalTrainer;
    }
    findAll() {
        return this.personalTrainerEntity.find();
    }
    findOne(id) {
        return this.personalTrainerEntity.findById(id);
    }
    update(id, updatePersonalTrainerDto) {
        return this.personalTrainerEntity.findByIdAndUpdate(id, updatePersonalTrainerDto);
    }
    remove(id) {
        return this.personalTrainerEntity.findByIdAndDelete(id);
    }
    findAllUsers(personalTrainer) {
        return this.userEntity.find({ personalTrainer: personalTrainer._id });
    }
    async addUserToPersonalTrainer(addPersonalTrainerDto, personalTrainer) {
        const user = await this.userEntity.findById(addPersonalTrainerDto.userId);
        if (!user) {
            throw new not_found_error_1.NotFoundException('User not found');
        }
        const checkIfUserIsAlreadyInPersonalTrainer = await this.personalTrainerEntity.findOne({
            users: { $in: [user._id] },
        });
        if (checkIfUserIsAlreadyInPersonalTrainer) {
            throw new common_1.BadRequestException('User already in personal trainer');
        }
        await this.personalTrainerEntity.findByIdAndUpdate(personalTrainer._id, {
            $push: { users: user._id },
        });
        await this.userEntity.findByIdAndUpdate(user._id, {
            personalTrainer: personalTrainer._id,
        });
        return {
            message: 'User added to personal trainer',
        };
    }
};
exports.PersonalTrainersService = PersonalTrainersService;
exports.PersonalTrainersService = PersonalTrainersService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_2.InjectModel)(personal_trainer_entity_1.PersonalTrainer.name)),
    __param(1, (0, mongoose_2.InjectModel)(user_entity_1.User.name)),
    __metadata("design:paramtypes", [mongoose_1.Model,
        mongoose_1.Model])
], PersonalTrainersService);
//# sourceMappingURL=personal-trainers.service.js.map