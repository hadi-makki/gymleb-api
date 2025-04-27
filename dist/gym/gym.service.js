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
exports.GymService = void 0;
const common_1 = require("@nestjs/common");
const gym_entity_1 = require("./entities/gym.entity");
const gym_owner_entity_1 = require("../gym-owner/entities/gym-owner.entity");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const transaction_entity_1 = require("../transactions/transaction.entity");
const member_entity_1 = require("../member/entities/member.entity");
const mongoose_3 = require("mongoose");
const date_fns_1 = require("date-fns");
let GymService = class GymService {
    constructor(gymModel, gymOwnerModel, transactionModel, memberModel) {
        this.gymModel = gymModel;
        this.gymOwnerModel = gymOwnerModel;
        this.transactionModel = transactionModel;
        this.memberModel = memberModel;
    }
    async create(createGymDto) {
        const checkGym = await this.gymModel.exists({
            name: createGymDto.name,
        });
        if (checkGym) {
            throw new common_1.BadRequestException('Gym already exists');
        }
        const gymOwner = await this.gymOwnerModel.findById(createGymDto.gymOwner);
        if (!gymOwner) {
            throw new common_1.NotFoundException('Gym owner not found');
        }
        const gym = new this.gymModel({ ...createGymDto, gymOwner });
        return gym.save();
    }
    async findAll() {
        return await this.gymModel.find();
    }
    async findOne(id) {
        const gym = await this.gymModel.findById(id);
        if (!gym) {
            throw new common_1.NotFoundException('Gym not found');
        }
        return gym;
    }
    async update(id, updateGymDto) {
        const gym = await this.gymModel.findByIdAndUpdate(id, updateGymDto, {
            new: true,
        });
        if (!gym) {
            throw new common_1.NotFoundException('Gym not found');
        }
        return gym;
    }
    async remove(id) {
        const gym = await this.gymModel.findByIdAndDelete(id);
        if (!gym) {
            throw new common_1.NotFoundException('Gym not found');
        }
        return gym;
    }
    async getGymAnalytics(manager) {
        const gym = await this.gymModel.findOne({ owner: manager.id });
        if (!gym) {
            throw new common_1.NotFoundException('Gym not found');
        }
        const now = new Date();
        const lastMonthStart = (0, date_fns_1.startOfMonth)((0, date_fns_1.subMonths)(now, 1));
        const lastMonthEnd = (0, date_fns_1.endOfMonth)((0, date_fns_1.subMonths)(now, 1));
        const currentMonthStart = (0, date_fns_1.startOfMonth)(now);
        const lastMonthTransactions = await this.transactionModel
            .find({
            gym: new mongoose_3.Types.ObjectId(gym.id),
            createdAt: { $gte: lastMonthStart, $lte: lastMonthEnd },
        })
            .populate('subscription');
        const currentMonthTransactions = await this.transactionModel
            .find({
            gym: new mongoose_3.Types.ObjectId(gym.id),
            createdAt: { $gte: currentMonthStart },
        })
            .populate('subscription');
        const lastMonthRevenue = lastMonthTransactions.reduce((total, transaction) => total + transaction.subscription.price, 0);
        const currentMonthRevenue = currentMonthTransactions.reduce((total, transaction) => total + transaction.subscription.price, 0);
        const revenueChange = lastMonthRevenue
            ? ((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100
            : 0;
        const lastMonthMembers = await this.memberModel.countDocuments({
            gym: gym.id,
            createdAt: { $gte: lastMonthStart, $lte: lastMonthEnd },
        });
        const currentMonthMembers = await this.memberModel.countDocuments({
            gym: gym.id,
            createdAt: { $gte: currentMonthStart },
        });
        const memberChange = lastMonthMembers
            ? ((currentMonthMembers - lastMonthMembers) / lastMonthMembers) * 100
            : 0;
        const transactions = await this.transactionModel
            .find({ gym: new mongoose_3.Types.ObjectId(gym.id) })
            .populate('subscription');
        const totalRevenue = transactions.reduce((total, transaction) => total + transaction.paidAmount || 0, 0);
        const totalMembers = await this.memberModel.countDocuments({ gym: gym.id });
        const members = await this.memberModel
            .find({ gym: gym.id })
            .populate('subscription')
            .populate('transactions')
            .populate('gym');
        const membersWithActiveSubscription = members.map((member) => {
            const checkActiveSubscription = member.transactions.some((transaction) => {
                return new Date(transaction.endDate) > new Date();
            });
            const latestTransaction = member.transactions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
            return {
                id: member.id,
                name: member.name,
                email: member.email,
                phone: member.phone,
                createdAt: member.createdAt,
                updatedAt: member.updatedAt,
                subscription: member.subscription,
                transactions: member.transactions,
                gym: member.gym,
                hasActiveSubscription: checkActiveSubscription,
                currentActiveSubscription: latestTransaction || null,
            };
        });
        return {
            totalRevenue,
            totalMembers,
            members: membersWithActiveSubscription,
            totalTransactions: transactions.length,
            revenueChange,
            memberChange,
        };
    }
    async getGymByGymName(gymName) {
        console.log(gymName);
        const decodedGymId = gymName.includes('%20')
            ? decodeURIComponent(gymName)
            : gymName;
        const gym = await this.gymModel
            .findOne({ name: decodedGymId })
            .populate('openingDays');
        if (!gym) {
            throw new common_1.NotFoundException('Gym not found');
        }
        return gym;
    }
    async updateGymDay(dayToUpdate, manager) {
        const gym = await this.gymModel.findOne({
            owner: manager.id,
        });
        if (!gym) {
            throw new common_1.NotFoundException('Gym not found');
        }
        const dayIndex = gym.openingDays.findIndex((day) => day.day === dayToUpdate);
        if (dayIndex === -1) {
            throw new common_1.NotFoundException('Day not found');
        }
        gym.openingDays[dayIndex].isOpen = !gym.openingDays[dayIndex].isOpen;
        return gym.save();
    }
};
exports.GymService = GymService;
exports.GymService = GymService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(gym_entity_1.Gym.name)),
    __param(1, (0, mongoose_1.InjectModel)(gym_owner_entity_1.GymOwner.name)),
    __param(2, (0, mongoose_1.InjectModel)(transaction_entity_1.Transaction.name)),
    __param(3, (0, mongoose_1.InjectModel)(member_entity_1.Member.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model])
], GymService);
//# sourceMappingURL=gym.service.js.map