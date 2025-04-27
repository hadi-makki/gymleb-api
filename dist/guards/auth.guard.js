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
exports.AuthGuard = void 0;
const injectable_decorator_1 = require("@nestjs/common/decorators/core/injectable.decorator");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const unauthorized_error_1 = require("../error/unauthorized-error");
const manager_entity_1 = require("../manager/manager.entity");
const token_service_1 = require("../token/token.service");
const member_entity_1 = require("../member/entities/member.entity");
let AuthGuard = class AuthGuard {
    constructor(memberRepository, managerRepository, tokenService) {
        this.memberRepository = memberRepository;
        this.managerRepository = managerRepository;
        this.tokenService = tokenService;
    }
    async canActivate(context) {
        const request = context
            .switchToHttp()
            .getRequest();
        const validatedData = await this.tokenService.validateJwt(request, context.switchToHttp().getResponse(), true);
        const userId = validatedData?.sub;
        console.log('userId', userId);
        if (!userId) {
            throw new unauthorized_error_1.UnauthorizedException('Unauthorized');
        }
        const member = await this.memberRepository.findById(userId);
        console.log('member', member);
        if (member) {
            request.user = member;
            return true;
        }
        throw new unauthorized_error_1.UnauthorizedException('Unauthorized');
    }
};
exports.AuthGuard = AuthGuard;
exports.AuthGuard = AuthGuard = __decorate([
    (0, injectable_decorator_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(member_entity_1.Member.name)),
    __param(1, (0, mongoose_1.InjectModel)(manager_entity_1.Manager.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        token_service_1.TokenService])
], AuthGuard);
//# sourceMappingURL=auth.guard.js.map