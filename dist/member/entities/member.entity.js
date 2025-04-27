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
exports.MemberSchema = exports.Member = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mainEntity_1 = require("../../main-classes/mainEntity");
const gym_entity_1 = require("../../gym/entities/gym.entity");
const mongoose_2 = require("mongoose");
const subscription_entity_1 = require("../../subscription/entities/subscription.entity");
const custom_schema_decorator_1 = require("../../decorators/custom-schema.decorator");
let Member = class Member extends mainEntity_1.MainEntity {
};
exports.Member = Member;
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], Member.prototype, "name", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, unique: true }),
    __metadata("design:type", String)
], Member.prototype, "username", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], Member.prototype, "email", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], Member.prototype, "phone", void 0);
__decorate([
    (0, mongoose_1.Prop)({ ref: 'Gym', type: mongoose_2.Types.ObjectId, required: true }),
    __metadata("design:type", gym_entity_1.Gym)
], Member.prototype, "gym", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, type: mongoose_2.Types.ObjectId, ref: 'Subscription' }),
    __metadata("design:type", subscription_entity_1.Subscription)
], Member.prototype, "subscription", void 0);
__decorate([
    (0, mongoose_1.Prop)({ ref: 'Transaction', type: [mongoose_2.Types.ObjectId], required: false }),
    __metadata("design:type", Array)
], Member.prototype, "transactions", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, required: false }),
    __metadata("design:type", String)
], Member.prototype, "passCode", void 0);
exports.Member = Member = __decorate([
    (0, custom_schema_decorator_1.CustomSchema)()
], Member);
exports.MemberSchema = mongoose_1.SchemaFactory.createForClass(Member);
//# sourceMappingURL=member.entity.js.map