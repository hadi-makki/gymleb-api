"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthenticationModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const jwt_1 = require("@nestjs/jwt");
const mongoose_1 = require("@nestjs/mongoose");
const token_entity_1 = require("../token/token.entity");
const token_service_1 = require("../token/token.service");
const user_entity_1 = require("../user/user.entity");
const auth_service_1 = require("../auth/auth.service");
const user_service_1 = require("../user/user.service");
const manager_service_1 = require("../manager/manager.service");
const manager_entity_1 = require("../manager/manager.entity");
const member_entity_1 = require("../member/entities/member.entity");
const gym_owner_entity_1 = require("../gym-owner/entities/gym-owner.entity");
let AuthenticationModule = class AuthenticationModule {
};
exports.AuthenticationModule = AuthenticationModule;
exports.AuthenticationModule = AuthenticationModule = __decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forFeature([
                { name: manager_entity_1.Manager.name, schema: manager_entity_1.ManagerSchema },
                { name: token_entity_1.default.name, schema: token_entity_1.TokenSchema },
                { name: user_entity_1.User.name, schema: user_entity_1.UserSchema },
                { name: member_entity_1.Member.name, schema: member_entity_1.MemberSchema },
                { name: gym_owner_entity_1.GymOwner.name, schema: gym_owner_entity_1.GymOwnerSchema },
            ]),
        ],
        providers: [
            manager_service_1.ManagerService,
            token_service_1.TokenService,
            jwt_1.JwtService,
            config_1.ConfigService,
            auth_service_1.AuthService,
            user_service_1.UserService,
        ],
        exports: [
            manager_service_1.ManagerService,
            jwt_1.JwtService,
            config_1.ConfigService,
            auth_service_1.AuthService,
            user_service_1.UserService,
            mongoose_1.MongooseModule,
            token_service_1.TokenService,
        ],
    })
], AuthenticationModule);
//# sourceMappingURL=AuthModule.module.js.map