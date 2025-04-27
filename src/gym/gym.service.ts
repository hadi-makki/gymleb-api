import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateGymDto } from './dto/create-gym.dto';
import { UpdateGymDto } from './dto/update-gym.dto';
import { Gym } from './entities/gym.entity';
import { GymOwner } from '../gym-owner/entities/gym-owner.entity';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Transaction } from '../transactions/transaction.entity';
import { Member } from '../member/entities/member.entity';
import { Manager } from '../manager/manager.entity';
import { Types } from 'mongoose';
import { subMonths, startOfMonth, endOfMonth } from 'date-fns';

@Injectable()
export class GymService {
  constructor(
    @InjectModel(Gym.name) private gymModel: Model<Gym>,
    @InjectModel(GymOwner.name) private gymOwnerModel: Model<GymOwner>,
    @InjectModel(Transaction.name) private transactionModel: Model<Transaction>,
    @InjectModel(Member.name) private memberModel: Model<Member>,
  ) {}

  async create(createGymDto: CreateGymDto) {
    const checkGym = await this.gymModel.exists({
      name: createGymDto.name,
    });
    if (checkGym) {
      throw new BadRequestException('Gym already exists');
    }
    const gymOwner = await this.gymOwnerModel.findById(createGymDto.gymOwner);
    if (!gymOwner) {
      throw new NotFoundException('Gym owner not found');
    }
    const gym = new this.gymModel({ ...createGymDto, gymOwner });
    return gym.save();
  }

  async findAll() {
    return await this.gymModel.find();
  }

  async findOne(id: string) {
    const gym = await this.gymModel.findById(id);
    if (!gym) {
      throw new NotFoundException('Gym not found');
    }
    return gym;
  }

  async update(id: string, updateGymDto: UpdateGymDto) {
    const gym = await this.gymModel.findByIdAndUpdate(id, updateGymDto, {
      new: true,
    });
    if (!gym) {
      throw new NotFoundException('Gym not found');
    }
    return gym;
  }

  async remove(id: string) {
    const gym = await this.gymModel.findByIdAndDelete(id);
    if (!gym) {
      throw new NotFoundException('Gym not found');
    }
    return gym;
  }

  async getGymAnalytics(manager: Manager) {
    const gym = await this.gymModel.findOne({ owner: manager.id });
    if (!gym) {
      throw new NotFoundException('Gym not found');
    }

    const now = new Date();
    const lastMonthStart = startOfMonth(subMonths(now, 1));
    const lastMonthEnd = endOfMonth(subMonths(now, 1));
    const currentMonthStart = startOfMonth(now);

    // Fetch transactions for last month
    const lastMonthTransactions = await this.transactionModel
      .find({
        gym: new Types.ObjectId(gym.id),
        createdAt: { $gte: lastMonthStart, $lte: lastMonthEnd },
      })
      .populate('subscription');

    // Fetch transactions for current month
    const currentMonthTransactions = await this.transactionModel
      .find({
        gym: new Types.ObjectId(gym.id),
        createdAt: { $gte: currentMonthStart },
      })
      .populate('subscription');

    // Calculate revenue for both periods
    const lastMonthRevenue = lastMonthTransactions.reduce(
      (total, transaction) => total + transaction.subscription.price,
      0,
    );
    const currentMonthRevenue = currentMonthTransactions.reduce(
      (total, transaction) => total + transaction.subscription.price,
      0,
    );

    // Calculate percentage change in revenue
    const revenueChange = lastMonthRevenue
      ? ((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100
      : 0;

    // Fetch member count for both periods
    const lastMonthMembers = await this.memberModel.countDocuments({
      gym: gym.id,
      createdAt: { $gte: lastMonthStart, $lte: lastMonthEnd },
    });
    const currentMonthMembers = await this.memberModel.countDocuments({
      gym: gym.id,
      createdAt: { $gte: currentMonthStart },
    });

    // Calculate percentage change in members
    const memberChange = lastMonthMembers
      ? ((currentMonthMembers - lastMonthMembers) / lastMonthMembers) * 100
      : 0;

    // Fetch all transactions and members for current analytics
    const transactions = await this.transactionModel
      .find({ gym: new Types.ObjectId(gym.id) })
      .populate('subscription');
    const totalRevenue = transactions.reduce(
      (total, transaction) => total + transaction.paidAmount || 0,
      0,
    );
    const totalMembers = await this.memberModel.countDocuments({ gym: gym.id });
    const members = await this.memberModel
      .find({ gym: gym.id })
      .populate('subscription')
      .populate('transactions')
      .populate('gym');

    const membersWithActiveSubscription = members.map((member) => {
      const checkActiveSubscription = member.transactions.some(
        (transaction) => {
          return new Date(transaction.endDate) > new Date();
        },
      );
      const latestTransaction = member.transactions.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )[0];
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

  async getGymByGymName(gymName: string) {
    console.log(gymName);
    const decodedGymId = gymName.includes('%20')
      ? decodeURIComponent(gymName)
      : gymName;

    const gym = await this.gymModel
      .findOne({ name: decodedGymId })
      .populate('openingDays');

    if (!gym) {
      throw new NotFoundException('Gym not found');
    }
    return gym;
  }

  async updateGymDay(dayToUpdate: string, manager: Manager) {
    const gym = await this.gymModel.findOne({
      owner: manager.id,
    });
    if (!gym) {
      throw new NotFoundException('Gym not found');
    }
    const dayIndex = gym.openingDays.findIndex(
      (day) => day.day === dayToUpdate,
    );
    if (dayIndex === -1) {
      throw new NotFoundException('Day not found');
    }
    gym.openingDays[dayIndex].isOpen = !gym.openingDays[dayIndex].isOpen;
    return gym.save();
  }
}
