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
exports.GymOwnerSchema = exports.GymOwner = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const manager_entity_1 = require("../../manager/manager.entity");
let GymOwner = class GymOwner extends manager_entity_1.Manager {
};
exports.GymOwner = GymOwner;
__decorate([
    (0, mongoose_1.Prop)({ type: [mongoose_2.Types.ObjectId], ref: 'Gym', required: false }),
    __metadata("design:type", Array)
], GymOwner.prototype, "gyms", void 0);
exports.GymOwner = GymOwner = __decorate([
    (0, mongoose_1.Schema)()
], GymOwner);
exports.GymOwnerSchema = mongoose_1.SchemaFactory.createForClass(GymOwner);
//# sourceMappingURL=gym-owner.entity.js.map