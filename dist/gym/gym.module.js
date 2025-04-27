"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GymModule = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const gym_owner_entity_1 = require("../gym-owner/entities/gym-owner.entity");
const gym_entity_1 = require("./entities/gym.entity");
const gym_controller_1 = require("./gym.controller");
const gym_service_1 = require("./gym.service");
const AuthModule_module_1 = require("../common/AuthModule.module");
const transaction_entity_1 = require("../transactions/transaction.entity");
const member_entity_1 = require("../member/entities/member.entity");
let GymModule = class GymModule {
};
exports.GymModule = GymModule;
exports.GymModule = GymModule = __decorate([
    (0, common_1.Module)({
        imports: [
            AuthModule_module_1.AuthenticationModule,
            mongoose_1.MongooseModule.forFeature([
                { name: gym_entity_1.Gym.name, schema: gym_entity_1.GymSchema },
                { name: gym_owner_entity_1.GymOwner.name, schema: gym_owner_entity_1.GymOwnerSchema },
                { name: transaction_entity_1.Transaction.name, schema: transaction_entity_1.TransactionSchema },
                { name: member_entity_1.Member.name, schema: member_entity_1.MemberSchema },
            ]),
        ],
        controllers: [gym_controller_1.GymController],
        providers: [gym_service_1.GymService],
    })
], GymModule);
//# sourceMappingURL=gym.module.js.map