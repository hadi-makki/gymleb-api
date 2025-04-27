"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MemberModule = void 0;
const common_1 = require("@nestjs/common");
const member_service_1 = require("./member.service");
const member_controller_1 = require("./member.controller");
const member_entity_1 = require("./entities/member.entity");
const mongoose_1 = require("@nestjs/mongoose");
const gym_entity_1 = require("../gym/entities/gym.entity");
const subscription_entity_1 = require("../subscription/entities/subscription.entity");
const AuthModule_module_1 = require("../common/AuthModule.module");
const transactions_module_1 = require("../transactions/transactions.module");
let MemberModule = class MemberModule {
};
exports.MemberModule = MemberModule;
exports.MemberModule = MemberModule = __decorate([
    (0, common_1.Module)({
        imports: [
            AuthModule_module_1.AuthenticationModule,
            mongoose_1.MongooseModule.forFeature([
                { name: member_entity_1.Member.name, schema: member_entity_1.MemberSchema },
                { name: gym_entity_1.Gym.name, schema: gym_entity_1.GymSchema },
                { name: subscription_entity_1.Subscription.name, schema: subscription_entity_1.SubscriptionSchema },
            ]),
            transactions_module_1.TransactionsModule,
        ],
        controllers: [member_controller_1.MemberController],
        providers: [member_service_1.MemberService],
    })
], MemberModule);
//# sourceMappingURL=member.module.js.map