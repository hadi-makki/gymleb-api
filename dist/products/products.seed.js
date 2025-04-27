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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubscriptionPlanSeeding = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const products_entity_1 = require("./products.entity");
const products = [];
const topics = [
    'Birthday Suprise',
    'Praise Mom’s Cooking',
    'Hype Up My Bestie',
    'Exam Motivation',
    'Ex-Exposed',
    'Flirt 101',
    'Resign to My Boss',
    'Break-Up Roast',
    'Other',
];
let SubscriptionPlanSeeding = class SubscriptionPlanSeeding {
    constructor(productRepository) {
        this.productRepository = productRepository;
    }
    async onModuleInit() {
        try {
        }
        catch (error) {
            console.error('Error seeding Products:', error);
        }
    }
    async seedproducts() {
        const getProducts = await this.productRepository.find();
        for (const product of products) {
            const existingProduct = getProducts.find((p) => p.name === product.name);
        }
    }
};
exports.SubscriptionPlanSeeding = SubscriptionPlanSeeding;
exports.SubscriptionPlanSeeding = SubscriptionPlanSeeding = __decorate([
    (0, common_1.Injectable)({ scope: common_1.Scope.DEFAULT }),
    __param(0, (0, mongoose_1.InjectModel)(products_entity_1.Product.name)),
    __metadata("design:paramtypes", [mongoose_2.Model])
], SubscriptionPlanSeeding);
//# sourceMappingURL=products.seed.js.map