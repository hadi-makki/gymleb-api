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
exports.UserSchema = exports.User = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const mainEntity_1 = require("../main-classes/mainEntity");
const bcrypt = require("bcryptjs");
const transaction_entity_1 = require("../transactions/transaction.entity");
const personal_trainer_entity_1 = require("../personal-trainers/entities/personal-trainer.entity");
const gym_entity_1 = require("../gym/entities/gym.entity");
const subscription_entity_1 = require("../subscription/entities/subscription.entity");
const custom_schema_decorator_1 = require("../decorators/custom-schema.decorator");
let User = class User extends mainEntity_1.MainEntity {
    async comparePassword(oldPassword) {
        return await bcrypt.compare(oldPassword, this.password);
    }
};
exports.User = User;
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], User.prototype, "email", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], User.prototype, "password", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], User.prototype, "name", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, type: mongoose_2.Types.ObjectId, ref: 'PersonalTrainer' }),
    __metadata("design:type", personal_trainer_entity_1.PersonalTrainer)
], User.prototype, "personalTrainer", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'Gym', required: false }),
    __metadata("design:type", gym_entity_1.Gym)
], User.prototype, "gym", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'Subscription', required: false }),
    __metadata("design:type", subscription_entity_1.Subscription)
], User.prototype, "subscription", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [{ type: mongoose_2.Types.ObjectId, ref: 'Token' }], default: [] }),
    __metadata("design:type", Array)
], User.prototype, "tokens", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [transaction_entity_1.Transaction], default: [], ref: 'Transaction' }),
    __metadata("design:type", Array)
], User.prototype, "transactions", void 0);
exports.User = User = __decorate([
    (0, custom_schema_decorator_1.CustomSchema)()
], User);
exports.UserSchema = mongoose_1.SchemaFactory.createForClass(User);
//# sourceMappingURL=user.entity.js.map