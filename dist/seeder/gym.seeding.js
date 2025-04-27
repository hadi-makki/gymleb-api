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
exports.GymSeeding = exports.Days = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const gym_entity_1 = require("../gym/entities/gym.entity");
const manager_entity_1 = require("../manager/manager.entity");
exports.Days = [
    { day: 'Monday', isOpen: true, openingTime: '09:00', closingTime: '17:00' },
    { day: 'Tuesday', isOpen: true, openingTime: '09:00', closingTime: '17:00' },
    {
        day: 'Wednesday',
        isOpen: true,
        openingTime: '09:00',
        closingTime: '17:00',
    },
    { day: 'Thursday', isOpen: true, openingTime: '09:00', closingTime: '17:00' },
    { day: 'Friday', isOpen: true, openingTime: '09:00', closingTime: '17:00' },
    { day: 'Saturday', isOpen: true, openingTime: '09:00', closingTime: '17:00' },
    { day: 'Sunday', isOpen: true, openingTime: '09:00', closingTime: '17:00' },
];
let GymSeeding = class GymSeeding {
    constructor(gymRepository, managerRepository) {
        this.gymRepository = gymRepository;
        this.managerRepository = managerRepository;
    }
    async onModuleInit() {
        await this.seedGyms();
    }
    async removeData() {
        await this.gymRepository.deleteMany({});
    }
    async seedGyms() {
        const name = 'Gym 1';
        const address = '123 Main St';
        const phone = '1234567890';
        const email = 'gym1@example.com';
        const getManager = await this.managerRepository.findOne({
            username: 'admin',
        });
        const exists = await this.gymRepository.findOne({
            name,
        });
        if (!exists && getManager) {
            await this.gymRepository.create({
                name,
                address,
                phone,
                email,
                owner: getManager.id,
                openingDays: exports.Days,
            });
            console.log('Gym seeded');
        }
    }
};
exports.GymSeeding = GymSeeding;
exports.GymSeeding = GymSeeding = __decorate([
    (0, common_1.Injectable)({ scope: common_1.Scope.DEFAULT }),
    __param(0, (0, mongoose_1.InjectModel)(gym_entity_1.Gym.name)),
    __param(1, (0, mongoose_1.InjectModel)(manager_entity_1.Manager.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model])
], GymSeeding);
//# sourceMappingURL=gym.seeding.js.map