"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TokenModule = void 0;
const common_1 = require("@nestjs/common");
const token_service_1 = require("./token.service");
const token_controller_1 = require("./token.controller");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const user_entity_1 = require("../user/user.entity");
const manager_entity_1 = require("../manager/manager.entity");
const mongoose_1 = require("@nestjs/mongoose");
const token_entity_1 = require("./token.entity");
const member_entity_1 = require("../member/entities/member.entity");
let TokenModule = class TokenModule {
};
exports.TokenModule = TokenModule;
exports.TokenModule = TokenModule = __decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forFeature([
                { name: token_entity_1.default.name, schema: token_entity_1.TokenSchema },
                { name: user_entity_1.User.name, schema: user_entity_1.UserSchema },
                { name: manager_entity_1.Manager.name, schema: manager_entity_1.ManagerSchema },
                { name: member_entity_1.Member.name, schema: member_entity_1.MemberSchema },
            ]),
        ],
        providers: [jwt_1.JwtService, token_service_1.TokenService, config_1.ConfigService],
        controllers: [token_controller_1.TokenController],
    })
], TokenModule);
//# sourceMappingURL=token.module.js.map