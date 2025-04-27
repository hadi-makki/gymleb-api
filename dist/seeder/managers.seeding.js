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
exports.ManagerSeeding = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const role_enum_1 = require("../decorators/roles/role.enum");
const manager_entity_1 = require("../manager/manager.entity");
let ManagerSeeding = class ManagerSeeding {
    constructor(managerRepository) {
        this.managerRepository = managerRepository;
    }
    async onModuleInit() {
        await this.seedManagers();
    }
    async removeData() {
        await this.managerRepository.deleteMany({});
    }
    async seedManagers() {
        const username = 'admin';
        const email = 'admin@example.com';
        const exists = await this.managerRepository.findOne({
            username,
            email,
        });
        if (!exists) {
            const hashedPassword = await manager_entity_1.Manager.hashPassword('Password1$');
            await this.managerRepository.create({
                username,
                email,
                password: hashedPassword,
                roles: [role_enum_1.Role.SuperAdmin],
            });
            console.log('Admin seeded');
        }
    }
};
exports.ManagerSeeding = ManagerSeeding;
exports.ManagerSeeding = ManagerSeeding = __decorate([
    (0, common_1.Injectable)({ scope: common_1.Scope.DEFAULT }),
    __param(0, (0, mongoose_1.InjectModel)(manager_entity_1.Manager.name)),
    __metadata("design:paramtypes", [mongoose_2.Model])
], ManagerSeeding);
//# sourceMappingURL=managers.seeding.js.map