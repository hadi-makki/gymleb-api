"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
const auth_module_1 = require("./auth/auth.module");
const database_module_1 = require("./database/database.module");
const logger_service_1 = require("./logger/logger.service");
const manager_module_1 = require("./manager/manager.module");
const media_module_1 = require("./media/media.module");
const s3_module_1 = require("./s3/s3.module");
const managers_seeding_1 = require("./seeder/managers.seeding");
const token_module_1 = require("./token/token.module");
const transactions_module_1 = require("./transactions/transactions.module");
const user_module_1 = require("./user/user.module");
const mongoose_1 = require("@nestjs/mongoose");
const manager_entity_1 = require("./manager/manager.entity");
const personal_trainers_module_1 = require("./personal-trainers/personal-trainers.module");
const subscription_module_1 = require("./subscription/subscription.module");
const gym_module_1 = require("./gym/gym.module");
const gym_owner_module_1 = require("./gym-owner/gym-owner.module");
const member_module_1 = require("./member/member.module");
const gym_seeding_1 = require("./seeder/gym.seeding");
const gym_entity_1 = require("./gym/entities/gym.entity");
let AppModule = class AppModule {
    configure(consumer) {
        consumer.apply(logger_service_1.loggerMiddleware).forRoutes('*');
    }
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forFeature([
                { name: manager_entity_1.Manager.name, schema: manager_entity_1.ManagerSchema },
                { name: gym_entity_1.Gym.name, schema: gym_entity_1.GymSchema },
            ]),
            config_1.ConfigModule,
            database_module_1.DatabaseModule,
            media_module_1.MediaModule,
            s3_module_1.S3Module,
            user_module_1.UserModule,
            auth_module_1.AuthModule,
            token_module_1.TokenModule,
            manager_module_1.ManagerModule,
            transactions_module_1.TransactionsModule,
            personal_trainers_module_1.PersonalTrainersModule,
            subscription_module_1.SubscriptionModule,
            gym_module_1.GymModule,
            gym_owner_module_1.GymOwnerModule,
            member_module_1.MemberModule,
        ],
        controllers: [app_controller_1.AppController],
        providers: [app_service_1.AppService, managers_seeding_1.ManagerSeeding, gym_seeding_1.GymSeeding],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map