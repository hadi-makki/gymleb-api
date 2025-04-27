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
exports.GymSchema = exports.Gym = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const custom_schema_decorator_1 = require("../../decorators/custom-schema.decorator");
const mainEntity_1 = require("../../main-classes/mainEntity");
const manager_entity_1 = require("../../manager/manager.entity");
let Gym = class Gym extends mainEntity_1.MainEntity {
};
exports.Gym = Gym;
__decorate([
    (0, mongoose_1.Prop)({ type: String }),
    __metadata("design:type", String)
], Gym.prototype, "name", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String }),
    __metadata("design:type", String)
], Gym.prototype, "address", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String }),
    __metadata("design:type", String)
], Gym.prototype, "phone", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [mongoose_2.Types.ObjectId], ref: 'PersonalTrainer', required: false }),
    __metadata("design:type", Array)
], Gym.prototype, "personalTrainers", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [mongoose_2.Types.ObjectId], ref: 'Subscription', required: false }),
    __metadata("design:type", Array)
], Gym.prototype, "subscriptions", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'Manager' }),
    __metadata("design:type", manager_entity_1.Manager)
], Gym.prototype, "owner", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: [
            {
                day: String,
                openingTime: String,
                closingTime: String,
                isOpen: Boolean,
            },
        ],
        required: false,
    }),
    __metadata("design:type", Array)
], Gym.prototype, "openingDays", void 0);
exports.Gym = Gym = __decorate([
    (0, custom_schema_decorator_1.CustomSchema)()
], Gym);
exports.GymSchema = mongoose_1.SchemaFactory.createForClass(Gym);
//# sourceMappingURL=gym.entity.js.map