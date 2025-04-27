"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StripeModule = void 0;
const common_1 = require("@nestjs/common");
const stripe_controller_1 = require("./stripe.controller");
const stripe_service_1 = require("./stripe.service");
const user_entity_1 = require("../user/user.entity");
const transaction_entity_1 = require("../transactions/transaction.entity");
const transactions_service_1 = require("../transactions/transactions.service");
const config_1 = require("@nestjs/config");
const manager_entity_1 = require("../manager/manager.entity");
const token_service_1 = require("../token/token.service");
const token_entity_1 = require("../token/token.entity");
const jwt_1 = require("@nestjs/jwt");
const products_entity_1 = require("../products/products.entity");
const products_service_1 = require("../products/products.service");
const mongoose_1 = require("@nestjs/mongoose");
let StripeModule = class StripeModule {
};
exports.StripeModule = StripeModule;
exports.StripeModule = StripeModule = __decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forFeature([
                { name: user_entity_1.User.name, schema: user_entity_1.UserSchema },
                { name: transaction_entity_1.Transaction.name, schema: transaction_entity_1.TransactionSchema },
                { name: manager_entity_1.Manager.name, schema: manager_entity_1.ManagerSchema },
                { name: token_entity_1.default.name, schema: token_entity_1.TokenSchema },
                { name: products_entity_1.Product.name, schema: products_entity_1.ProductSchema },
            ]),
        ],
        providers: [
            stripe_service_1.StripeService,
            transactions_service_1.TransactionsService,
            config_1.ConfigService,
            token_service_1.TokenService,
            jwt_1.JwtService,
            products_service_1.ProductsService,
        ],
        controllers: [stripe_controller_1.StripeController],
    })
], StripeModule);
//# sourceMappingURL=stripe.module.js.map