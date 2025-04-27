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
exports.TransactionSchema = exports.Transaction = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const custom_schema_decorator_1 = require("../decorators/custom-schema.decorator");
const mainEntity_1 = require("../main-classes/mainEntity");
const gym_entity_1 = require("../gym/entities/gym.entity");
const subscription_entity_1 = require("../subscription/entities/subscription.entity");
const member_entity_1 = require("../member/entities/member.entity");
let Transaction = class Transaction extends mainEntity_1.MainEntity {
};
exports.Transaction = Transaction;
__decorate([
    (0, mongoose_1.Prop)({ type: String, required: false }),
    __metadata("design:type", String)
], Transaction.prototype, "endDate", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number, required: false }),
    __metadata("design:type", Number)
], Transaction.prototype, "paidAmount", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, required: false, ref: 'Gym' }),
    __metadata("design:type", gym_entity_1.Gym)
], Transaction.prototype, "gym", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, required: false, ref: 'Subscription' }),
    __metadata("design:type", subscription_entity_1.Subscription)
], Transaction.prototype, "subscription", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, required: false, ref: 'Member' }),
    __metadata("design:type", member_entity_1.Member)
], Transaction.prototype, "member", void 0);
exports.Transaction = Transaction = __decorate([
    (0, custom_schema_decorator_1.CustomSchema)()
], Transaction);
exports.TransactionSchema = mongoose_1.SchemaFactory.createForClass(Transaction);
//# sourceMappingURL=transaction.entity.js.map