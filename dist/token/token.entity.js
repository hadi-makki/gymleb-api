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
Object.defineProperty(exports, "__esModule", { value: true });
exports.TokenSchema = exports.TokenType = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const custom_schema_decorator_1 = require("../decorators/custom-schema.decorator");
const mainEntity_1 = require("../main-classes/mainEntity");
const manager_entity_1 = require("../manager/manager.entity");
const member_entity_1 = require("../member/entities/member.entity");
const user_entity_1 = require("../user/user.entity");
var TokenType;
(function (TokenType) {
    TokenType["Access"] = "access";
    TokenType["Refresh"] = "refresh";
    TokenType["ResetPassword"] = "reset-password";
})(TokenType || (exports.TokenType = TokenType = {}));
let Token = class Token extends mainEntity_1.MainEntity {
};
__decorate([
    (0, mongoose_1.Prop)({ type: String, unique: true, default: null }),
    __metadata("design:type", String)
], Token.prototype, "accessToken", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, unique: true, default: null }),
    __metadata("design:type", String)
], Token.prototype, "refreshToken", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Date, default: null }),
    __metadata("design:type", Date)
], Token.prototype, "refreshExpirationDate", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Date, default: null }),
    __metadata("design:type", Date)
], Token.prototype, "accessExpirationDate", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, default: null }),
    __metadata("design:type", String)
], Token.prototype, "deviceId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'User', nullable: true }),
    __metadata("design:type", user_entity_1.User)
], Token.prototype, "user", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'Member', nullable: true }),
    __metadata("design:type", member_entity_1.Member)
], Token.prototype, "member", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'Manager', nullable: true }),
    __metadata("design:type", manager_entity_1.Manager)
], Token.prototype, "manager", void 0);
Token = __decorate([
    (0, custom_schema_decorator_1.CustomSchema)()
], Token);
exports.TokenSchema = mongoose_1.SchemaFactory.createForClass(Token);
exports.default = Token;
//# sourceMappingURL=token.entity.js.map