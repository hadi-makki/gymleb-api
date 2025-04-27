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
exports.TransactionsService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const not_found_error_1 = require("../error/not-found-error");
const products_entity_1 = require("../products/products.entity");
const user_entity_1 = require("../user/user.entity");
const transaction_entity_1 = require("./transaction.entity");
const member_entity_1 = require("../member/entities/member.entity");
const gym_entity_1 = require("../gym/entities/gym.entity");
const subscription_entity_1 = require("../subscription/entities/subscription.entity");
const date_fns_1 = require("date-fns");
let TransactionsService = class TransactionsService {
    constructor(transactionRepository, userRepository, productRepository, memberRepository, gymRepository, subscriptionRepository) {
        this.transactionRepository = transactionRepository;
        this.userRepository = userRepository;
        this.productRepository = productRepository;
        this.memberRepository = memberRepository;
        this.gymRepository = gymRepository;
        this.subscriptionRepository = subscriptionRepository;
    }
    async createTransaction(paymentDetails) {
        const getMember = await this.memberRepository.findById(paymentDetails.memberId);
        if (!getMember) {
            throw new not_found_error_1.NotFoundException('Member not found');
        }
        const getGym = await this.gymRepository.findById(paymentDetails.gymId);
        if (!getGym) {
            throw new not_found_error_1.NotFoundException('Gym not found');
        }
        const getSubscription = await this.subscriptionRepository.findById(paymentDetails.subscriptionId);
        if (!getSubscription) {
            throw new not_found_error_1.NotFoundException('Subscription not found');
        }
        const newTransaction = this.transactionRepository.create({
            member: getMember,
            gym: getGym,
            subscription: getSubscription,
            endDate: (0, date_fns_1.addDays)(new Date(), getSubscription.duration).toISOString(),
            paidAmount: paymentDetails.amount,
        });
        return newTransaction;
    }
    async createAiPhoneNumberTransaction(paymentDetails) { }
    async findAllTransactions(memberId) {
        return this.transactionRepository
            .find({ member: memberId })
            .populate('subscription')
            .populate('gym');
    }
};
exports.TransactionsService = TransactionsService;
exports.TransactionsService = TransactionsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(transaction_entity_1.Transaction.name)),
    __param(1, (0, mongoose_1.InjectModel)(user_entity_1.User.name)),
    __param(2, (0, mongoose_1.InjectModel)(products_entity_1.Product.name)),
    __param(3, (0, mongoose_1.InjectModel)(member_entity_1.Member.name)),
    __param(4, (0, mongoose_1.InjectModel)(gym_entity_1.Gym.name)),
    __param(5, (0, mongoose_1.InjectModel)(subscription_entity_1.Subscription.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model])
], TransactionsService);
//# sourceMappingURL=transactions.service.js.map