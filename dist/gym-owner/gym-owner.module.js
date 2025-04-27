"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GymOwnerModule = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const AuthModule_module_1 = require("../common/AuthModule.module");
const gym_owner_entity_1 = require("./entities/gym-owner.entity");
const gym_owner_controller_1 = require("./gym-owner.controller");
const gym_owner_service_1 = require("./gym-owner.service");
const gym_entity_1 = require("../gym/entities/gym.entity");
let GymOwnerModule = class GymOwnerModule {
};
exports.GymOwnerModule = GymOwnerModule;
exports.GymOwnerModule = GymOwnerModule = __decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forFeature([
                { name: gym_owner_entity_1.GymOwner.name, schema: gym_owner_entity_1.GymOwnerSchema },
                { name: gym_entity_1.Gym.name, schema: gym_entity_1.GymSchema },
            ]),
            AuthModule_module_1.AuthenticationModule,
        ],
        controllers: [gym_owner_controller_1.GymOwnerController],
        providers: [gym_owner_service_1.GymOwnerService],
    })
], GymOwnerModule);
//# sourceMappingURL=gym-owner.module.js.map