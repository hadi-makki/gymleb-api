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
exports.MemberService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const member_entity_1 = require("./entities/member.entity");
const gym_entity_1 = require("../gym/entities/gym.entity");
const not_found_error_1 = require("../error/not-found-error");
const subscription_entity_1 = require("../subscription/entities/subscription.entity");
const transactions_service_1 = require("../transactions/transactions.service");
const class_validator_1 = require("class-validator");
const bad_request_error_1 = require("../error/bad-request-error");
const token_service_1 = require("../token/token.service");
let MemberService = class MemberService {
    constructor(memberModel, gymModel, subscriptionModel, transationService, tokenService) {
        this.memberModel = memberModel;
        this.gymModel = gymModel;
        this.subscriptionModel = subscriptionModel;
        this.transationService = transationService;
        this.tokenService = tokenService;
    }
    async create(createMemberDto, manager) {
        console.log(createMemberDto.subscriptionId);
        const gym = await this.gymModel.findOne({
            owner: manager.id,
        });
        console.log('gym', gym);
        if (!gym) {
            throw new not_found_error_1.NotFoundException('Gym not found');
        }
        const subscription = await this.subscriptionModel.findOne({
            _id: createMemberDto.subscriptionId,
        });
        console.log('subscription', subscription);
        if (!subscription) {
            throw new not_found_error_1.NotFoundException('Subscription not found');
        }
        let username = createMemberDto.name
            .split(' ')
            .map((name) => name[0])
            .join('')
            .toLowerCase() + Math.floor(1000 + Math.random() * 9000);
        const checkUsername = await this.memberModel.findOne({
            username: username,
        });
        if (checkUsername) {
            username =
                createMemberDto.name
                    .split(' ')
                    .map((name) => {
                    return `${name[0]}${name[1]}`;
                })
                    .join('')
                    .toLowerCase() + Math.floor(1000 + Math.random() * 9000);
        }
        const member = await this.memberModel.create({
            ...createMemberDto,
            gym: gym.id,
            subscription: subscription.id,
            username: username,
            passCode: `${createMemberDto.name.slice(0, 3).toLowerCase()}-${Math.floor(1000 + Math.random() * 9000)}`,
        });
        const transaction = await this.transationService.createTransaction({
            memberId: member.id,
            gymId: gym.id,
            subscriptionId: subscription.id,
            subscriptionType: subscription.type,
            amount: subscription.price,
        });
        member.transactions = [transaction.id];
        await member.save();
        const newMember = await this.memberModel
            .findById(member.id)
            .populate('gym')
            .populate('subscription')
            .populate('transactions');
        console.log('newMember', newMember);
        return {
            id: newMember.id,
            name: newMember.name,
            email: newMember.email,
            phone: newMember.phone,
            gym: newMember.gym,
            subscription: newMember.subscription,
            transactions: newMember.transactions,
            hasActiveSubscription: true,
        };
    }
    async loginMember(loginMemberDto) {
        console.log('loginMemberDto', loginMemberDto);
        const member = await this.memberModel.findOne({
            username: loginMemberDto.username,
            passCode: loginMemberDto.password,
        });
        if (!member) {
            throw new bad_request_error_1.BadRequestException('Invalid passcode or username');
        }
        console.log('member', member.id);
        const token = await this.tokenService.generateTokens({
            managerId: null,
            userId: member.id,
        });
        console.log('token', token);
        return {
            id: member.id,
            name: member.name,
            email: member.email,
            phone: member.phone,
            gym: member.gym,
            token: token.accessToken,
        };
    }
    async findAll(manager) {
        const checkGym = await this.gymModel.findOne({
            owner: manager.id,
        });
        if (!checkGym) {
            throw new not_found_error_1.NotFoundException('Gym not found');
        }
        const getMembers = await this.memberModel
            .find({
            gym: checkGym.id,
        })
            .populate('gym')
            .populate('subscription')
            .populate('transactions');
        const checkMembers = getMembers.map((member) => {
            const checkActiveSubscription = member.transactions.some((transaction) => {
                return new Date(transaction.endDate) > new Date();
            });
            const currentActiveSubscription = member.transactions.find((transaction) => {
                return new Date(transaction.endDate) > new Date();
            });
            return {
                id: member.id,
                name: member.name,
                email: member.email,
                phone: member.phone,
                gym: member.gym,
                subscription: member.subscription,
                transactions: member.transactions,
                createdAt: member.createdAt,
                updatedAt: member.updatedAt,
                hasActiveSubscription: checkActiveSubscription,
                currentActiveSubscription: currentActiveSubscription,
            };
        });
        return checkMembers;
    }
    async findOne(id) {
        if (!(0, class_validator_1.isMongoId)(id)) {
            throw new bad_request_error_1.BadRequestException('Invalid member id');
        }
        const member = await this.memberModel
            .findById(id)
            .populate('gym')
            .populate('subscription')
            .populate('transactions');
        const checkActiveSubscription = member.transactions.some((transaction) => {
            return new Date(transaction.endDate) > new Date();
        });
        let latestTransaction;
        let checkSubscription;
        if (member.transactions.length > 0) {
            latestTransaction = member.transactions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
            checkSubscription = await this.subscriptionModel.findOne({
                _id: latestTransaction.subscription,
            });
        }
        else {
            console.log(' this is the member', member);
            checkSubscription = await this.subscriptionModel.findOne({
                gym: member.gym.id,
            });
            console.log(' this is the checkSubscription', checkSubscription);
            if (!checkSubscription) {
                throw new not_found_error_1.NotFoundException('Subscription not found');
            }
            const transaction = await this.transationService.createTransaction({
                memberId: member.id,
                gymId: member.gym.id,
                subscriptionId: checkSubscription.id,
                subscriptionType: checkSubscription.type,
                amount: checkSubscription.price,
            });
            member.transactions = [transaction.id];
            member.subscription = checkSubscription.id;
            await member.save();
            latestTransaction = transaction;
            checkSubscription = checkSubscription;
        }
        latestTransaction.subscription = checkSubscription;
        return {
            id: member.id,
            name: member.name,
            email: member.email,
            phone: member.phone,
            gym: member.gym,
            subscription: member.subscription,
            transactions: member.transactions,
            createdAt: member.createdAt,
            updatedAt: member.updatedAt,
            hasActiveSubscription: checkActiveSubscription,
            currentActiveSubscription: latestTransaction || null,
        };
    }
    async renewSubscription(id) {
        if (!(0, class_validator_1.isMongoId)(id)) {
            throw new bad_request_error_1.BadRequestException('Invalid member id');
        }
        const member = await this.memberModel.findById(id).populate('transactions');
        console.log(' this is the member', member);
        if (!member) {
            throw new not_found_error_1.NotFoundException('Member not found');
        }
        const checkGym = await this.gymModel.findById(member.gym);
        if (!checkGym) {
            throw new not_found_error_1.NotFoundException('Gym not found');
        }
        let checkSubscription;
        console.log(' this is the member', member);
        if (member.transactions.length > 0) {
            const getLatestTransaction = member.transactions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
            checkSubscription = await this.subscriptionModel.findById(getLatestTransaction.subscription);
        }
        else {
            checkSubscription = await this.subscriptionModel.findOne({
                gym: checkGym.id,
            });
            if (!checkSubscription) {
                throw new not_found_error_1.NotFoundException('Subscription not found');
            }
            member.subscription = checkSubscription.id;
            await member.save();
        }
        const createTransaction = await this.transationService.createTransaction({
            memberId: member.id,
            gymId: checkGym.id,
            subscriptionId: checkSubscription.id,
            subscriptionType: checkSubscription.type,
            amount: checkSubscription.price,
        });
        member.transactions.push(createTransaction.id);
        await member.save();
        return {
            message: 'Subscription renewed successfully',
        };
    }
    async update(id, updateMemberDto) {
        if (!(0, class_validator_1.isMongoId)(id)) {
            throw new bad_request_error_1.BadRequestException('Invalid member id');
        }
        const member = await this.memberModel.findById(id);
        if (!member) {
            throw new not_found_error_1.NotFoundException('Member not found');
        }
    }
    async remove(id) {
        if (!(0, class_validator_1.isMongoId)(id)) {
            throw new bad_request_error_1.BadRequestException('Invalid member id');
        }
        const member = await this.memberModel.findById(id);
        if (!member) {
            throw new not_found_error_1.NotFoundException('Member not found');
        }
        await this.memberModel.findByIdAndDelete(id);
        return { message: 'Member deleted successfully' };
    }
    async getExpiredMembers(manager) {
        const gym = await this.gymModel.findOne({
            owner: manager.id,
        });
        console.log(' this is the gym', gym);
        if (!gym) {
            throw new not_found_error_1.NotFoundException('Gym not found');
        }
        const getMembers = await this.memberModel
            .find({
            gym: gym.id,
        })
            .populate('transactions')
            .populate('subscription');
        const expiredMembers = getMembers.filter((member) => {
            const latestTransaction = member.transactions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
            if (new Date(latestTransaction.endDate) < new Date()) {
                return {
                    id: member.id,
                    name: member.name,
                    email: member.email,
                    phone: member.phone,
                    gym: member.gym,
                    subscription: member.subscription,
                    transactions: member.transactions,
                    createdAt: member.createdAt,
                    updatedAt: member.updatedAt,
                    hasActiveSubscription: false,
                    currentActiveSubscription: latestTransaction || null,
                };
            }
        });
        return expiredMembers;
    }
    async getMe(member) {
        const checkMember = await this.memberModel
            .findById(member.id)
            .populate('gym')
            .populate('subscription')
            .populate('transactions');
        const checkActiveSubscription = checkMember.transactions.some((transaction) => {
            return new Date(transaction.endDate) > new Date();
        });
        const latestTransaction = checkMember.transactions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
        return {
            id: checkMember.id,
            name: checkMember.name,
            email: checkMember.email,
            phone: checkMember.phone,
            gym: checkMember.gym,
            subscription: checkMember.subscription,
            hasActiveSubscription: checkActiveSubscription,
            currentActiveSubscription: latestTransaction || null,
        };
    }
};
exports.MemberService = MemberService;
exports.MemberService = MemberService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(member_entity_1.Member.name)),
    __param(1, (0, mongoose_1.InjectModel)(gym_entity_1.Gym.name)),
    __param(2, (0, mongoose_1.InjectModel)(subscription_entity_1.Subscription.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        transactions_service_1.TransactionsService,
        token_service_1.TokenService])
], MemberService);
//# sourceMappingURL=member.service.js.map