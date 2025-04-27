"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionsModule = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const transactions_service_1 = require("./transactions.service");
const transaction_entity_1 = require("./transaction.entity");
const user_entity_1 = require("../user/user.entity");
const products_entity_1 = require("../products/products.entity");
const subscription_entity_1 = require("../subscription/entities/subscription.entity");
const member_entity_1 = require("../member/entities/member.entity");
const gym_entity_1 = require("../gym/entities/gym.entity");
const member_entity_2 = require("../member/entities/member.entity");
const gym_entity_2 = require("../gym/entities/gym.entity");
const subscription_entity_2 = require("../subscription/entities/subscription.entity");
let TransactionsModule = class TransactionsModule {
};
exports.TransactionsModule = TransactionsModule;
exports.TransactionsModule = TransactionsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forFeature([
                { name: transaction_entity_1.Transaction.name, schema: transaction_entity_1.TransactionSchema },
                { name: user_entity_1.User.name, schema: user_entity_1.UserSchema },
                { name: products_entity_1.Product.name, schema: products_entity_1.ProductSchema },
                { name: member_entity_2.Member.name, schema: member_entity_1.MemberSchema },
                { name: gym_entity_2.Gym.name, schema: gym_entity_1.GymSchema },
                { name: subscription_entity_2.Subscription.name, schema: subscription_entity_1.SubscriptionSchema },
            ]),
        ],
        providers: [transactions_service_1.TransactionsService],
        exports: [transactions_service_1.TransactionsService],
    })
], TransactionsModule);
//# sourceMappingURL=transactions.module.js.map