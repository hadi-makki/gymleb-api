"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PersonalTrainersModule = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const AuthModule_module_1 = require("../common/AuthModule.module");
const personal_trainer_entity_1 = require("./entities/personal-trainer.entity");
const personal_trainers_controller_1 = require("./personal-trainers.controller");
const personal_trainers_service_1 = require("./personal-trainers.service");
let PersonalTrainersModule = class PersonalTrainersModule {
};
exports.PersonalTrainersModule = PersonalTrainersModule;
exports.PersonalTrainersModule = PersonalTrainersModule = __decorate([
    (0, common_1.Module)({
        imports: [
            AuthModule_module_1.AuthenticationModule,
            mongoose_1.MongooseModule.forFeature([
                { name: personal_trainer_entity_1.PersonalTrainer.name, schema: personal_trainer_entity_1.PersonalTrainerSchema },
            ]),
        ],
        controllers: [personal_trainers_controller_1.PersonalTrainersController],
        providers: [personal_trainers_service_1.PersonalTrainersService],
    })
], PersonalTrainersModule);
//# sourceMappingURL=personal-trainers.module.js.map