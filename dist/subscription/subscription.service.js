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
exports.SubscriptionService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const subscription_entity_1 = require("./entities/subscription.entity");
const mongoose_2 = require("mongoose");
const gym_entity_1 = require("../gym/entities/gym.entity");
const validator_1 = require("validator");
const bad_request_error_1 = require("../error/bad-request-error");
let SubscriptionService = class SubscriptionService {
    constructor(subscriptionModel, gymModel) {
        this.subscriptionModel = subscriptionModel;
        this.gymModel = gymModel;
    }
    async create(createSubscriptionDto, manager) {
        console.log('manager', manager);
        const gym = await this.gymModel.findOne({ owner: manager._id.toString() });
        const subscription = await this.subscriptionModel.create({
            ...createSubscriptionDto,
            gym: gym.id,
        });
        return subscription;
    }
    async findAll(manager) {
        const gym = await this.gymModel.findOne({ owner: manager._id.toString() });
        const subscriptions = await this.subscriptionModel.find({ gym: gym.id });
        return subscriptions;
    }
    async findOne(id) {
        const subscription = await this.subscriptionModel.findById(id);
        return subscription;
    }
    async update(id, updateSubscriptionDto) {
        if (!(0, validator_1.isMongoId)(id)) {
            throw new bad_request_error_1.BadRequestException('Invalid subscription id');
        }
        console.log('updateSubscriptionDto', updateSubscriptionDto);
        const subscription = await this.subscriptionModel.findByIdAndUpdate(id, updateSubscriptionDto);
        if (!subscription) {
            throw new common_1.NotFoundException('Subscription not found');
        }
        const newSubscription = await this.subscriptionModel.findById(id);
        return newSubscription;
    }
    async remove(id) {
        const subscription = await this.subscriptionModel.findByIdAndDelete(id);
        return subscription;
    }
    async getSubscriptionTypes() {
        return Object.values(subscription_entity_1.SubscriptionType).map((type) => ({
            label: type
                .split('_')
                .join(' ')
                .replace(/\b\w/g, (char) => char.toUpperCase()),
            value: type,
        }));
    }
};
exports.SubscriptionService = SubscriptionService;
exports.SubscriptionService = SubscriptionService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(subscription_entity_1.Subscription.name)),
    __param(1, (0, mongoose_1.InjectModel)(gym_entity_1.Gym.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model])
], SubscriptionService);
//# sourceMappingURL=subscription.service.js.map