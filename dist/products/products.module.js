"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductsModule = void 0;
const common_1 = require("@nestjs/common");
const user_entity_1 = require("../user/user.entity");
const products_controller_1 = require("./products.controller");
const products_entity_1 = require("./products.entity");
const products_seed_1 = require("./products.seed");
const products_service_1 = require("./products.service");
const mongoose_1 = require("@nestjs/mongoose");
let ProductsModule = class ProductsModule {
};
exports.ProductsModule = ProductsModule;
exports.ProductsModule = ProductsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forFeature([
                { name: products_entity_1.Product.name, schema: products_entity_1.ProductSchema },
                { name: user_entity_1.User.name, schema: user_entity_1.UserSchema },
            ]),
        ],
        providers: [products_service_1.ProductsService, products_seed_1.SubscriptionPlanSeeding],
        controllers: [products_controller_1.ProductsController],
    })
], ProductsModule);
//# sourceMappingURL=products.module.js.map