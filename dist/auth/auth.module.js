"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthModule = void 0;
const common_1 = require("@nestjs/common");
const auth_controller_1 = require("./auth.controller");
const auth_service_1 = require("./auth.service");
const user_entity_1 = require("../user/user.entity");
const token_service_1 = require("../token/token.service");
const user_service_1 = require("../user/user.service");
const token_entity_1 = require("../token/token.entity");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const manager_entity_1 = require("../manager/manager.entity");
const mongoose_1 = require("@nestjs/mongoose");
const member_entity_1 = require("../member/entities/member.entity");
let AuthModule = class AuthModule {
};
exports.AuthModule = AuthModule;
exports.AuthModule = AuthModule = __decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forFeature([
                { name: user_entity_1.User.name, schema: user_entity_1.UserSchema },
                { name: token_entity_1.default.name, schema: token_entity_1.TokenSchema },
                { name: manager_entity_1.Manager.name, schema: manager_entity_1.ManagerSchema },
                { name: member_entity_1.Member.name, schema: member_entity_1.MemberSchema },
            ]),
        ],
        controllers: [auth_controller_1.AuthController],
        providers: [
            auth_service_1.AuthService,
            user_service_1.UserService,
            jwt_1.JwtService,
            config_1.ConfigService,
            token_service_1.TokenService,
        ],
    })
], AuthModule);
//# sourceMappingURL=auth.module.js.map