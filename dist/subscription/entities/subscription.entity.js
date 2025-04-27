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
exports.SubscriptionSchema = exports.Subscription = exports.SubscriptionType = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const custom_schema_decorator_1 = require("../../decorators/custom-schema.decorator");
const gym_entity_1 = require("../../gym/entities/gym.entity");
const user_entity_1 = require("../../user/user.entity");
var SubscriptionType;
(function (SubscriptionType) {
    SubscriptionType["PERSONAL_TRAINER"] = "personal_trainer";
    SubscriptionType["MONTHLY_GYM"] = "monthly_gym";
    SubscriptionType["YEARLY_GYM"] = "yearly_gym";
    SubscriptionType["DAILY_GYM"] = "daily_gym";
})(SubscriptionType || (exports.SubscriptionType = SubscriptionType = {}));
let Subscription = class Subscription {
};
exports.Subscription = Subscription;
__decorate([
    (0, mongoose_1.Prop)({ type: String }),
    __metadata("design:type", String)
], Subscription.prototype, "title", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, enum: SubscriptionType }),
    __metadata("design:type", String)
], Subscription.prototype, "type", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number }),
    __metadata("design:type", Number)
], Subscription.prototype, "price", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number }),
    __metadata("design:type", Number)
], Subscription.prototype, "duration", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'User' }),
    __metadata("design:type", user_entity_1.User)
], Subscription.prototype, "user", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'Gym', required: false }),
    __metadata("design:type", gym_entity_1.Gym)
], Subscription.prototype, "gym", void 0);
exports.Subscription = Subscription = __decorate([
    (0, custom_schema_decorator_1.CustomSchema)()
], Subscription);
exports.SubscriptionSchema = mongoose_1.SchemaFactory.createForClass(Subscription);
//# sourceMappingURL=subscription.entity.js.map