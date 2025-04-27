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
exports.PersonalTrainerSchema = exports.PersonalTrainer = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const manager_entity_1 = require("../../manager/manager.entity");
const gym_entity_1 = require("../../gym/entities/gym.entity");
const custom_schema_decorator_1 = require("../../decorators/custom-schema.decorator");
let PersonalTrainer = class PersonalTrainer extends manager_entity_1.Manager {
};
exports.PersonalTrainer = PersonalTrainer;
__decorate([
    (0, mongoose_1.Prop)({ required: true, type: [mongoose_2.Types.ObjectId], ref: 'User' }),
    __metadata("design:type", Array)
], PersonalTrainer.prototype, "users", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'Gym', required: false }),
    __metadata("design:type", gym_entity_1.Gym)
], PersonalTrainer.prototype, "gym", void 0);
exports.PersonalTrainer = PersonalTrainer = __decorate([
    (0, custom_schema_decorator_1.CustomSchema)()
], PersonalTrainer);
exports.PersonalTrainerSchema = mongoose_1.SchemaFactory.createForClass(PersonalTrainer);
//# sourceMappingURL=personal-trainer.entity.js.map