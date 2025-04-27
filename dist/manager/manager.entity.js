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
exports.ManagerSchema = exports.Manager = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const bcrypt = require("bcrypt");
const mongoose_2 = require("mongoose");
const custom_schema_decorator_1 = require("../decorators/custom-schema.decorator");
const role_enum_1 = require("../decorators/roles/role.enum");
const gym_entity_1 = require("../gym/entities/gym.entity");
const mainEntity_1 = require("../main-classes/mainEntity");
let Manager = class Manager extends mainEntity_1.MainEntity {
    static async isPasswordMatch(password, hashedPassword) {
        return bcrypt.compare(password, hashedPassword);
    }
    static async hashPassword(password) {
        return bcrypt.hash(password, 10);
    }
};
exports.Manager = Manager;
__decorate([
    (0, mongoose_1.Prop)({ required: true, unique: true }),
    __metadata("design:type", String)
], Manager.prototype, "username", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], Manager.prototype, "password", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, unique: true }),
    __metadata("design:type", String)
], Manager.prototype, "email", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [{ type: mongoose_2.Types.ObjectId, ref: 'Token' }] }),
    __metadata("design:type", Array)
], Manager.prototype, "tokens", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [String], enum: role_enum_1.Role, default: [role_enum_1.Role.Any] }),
    __metadata("design:type", Array)
], Manager.prototype, "roles", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'Gym', required: false }),
    __metadata("design:type", gym_entity_1.Gym)
], Manager.prototype, "gym", void 0);
exports.Manager = Manager = __decorate([
    (0, custom_schema_decorator_1.CustomSchema)()
], Manager);
exports.ManagerSchema = mongoose_1.SchemaFactory.createForClass(Manager);
//# sourceMappingURL=manager.entity.js.map