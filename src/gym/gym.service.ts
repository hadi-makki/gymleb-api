import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateGymDto } from './dto/create-gym.dto';
import { UpdateGymDto } from './dto/update-gym.dto';
import { Gym } from './entities/gym.entity';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Model } from 'mongoose';
import { SubscriptionInstance } from '../transactions/subscription-instance.entity';
import { Member } from '../member/entities/member.entity';
import { Manager } from '../manager/manager.entity';
import { Types } from 'mongoose';
import { subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { Expense } from '../expenses/expense.entity';
import { OwnerSubscription } from 'src/owner-subscriptions/owner-subscription.entity';
import { paginateModel } from '../utils/pagination';

@Injectable()
export class GymService {
  constructor(
    @InjectModel(Gym.name) private gymModel: Model<Gym>,
    @InjectModel(Manager.name) private gymOwnerModel: Model<Manager>,
    @InjectModel(SubscriptionInstance.name)
    private subscriptionInstanceModel: Model<SubscriptionInstance>,
    @InjectModel(Member.name) private memberModel: Model<Member>,
    @InjectModel(Expense.name) private expenseModel: Model<Expense>,
    @InjectModel(OwnerSubscription.name)
    private ownerSubscriptionModel: Model<OwnerSubscription>,
    @InjectModel(Manager.name) private managerModel: Model<Manager>,
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
    return await this.gymModel.find().populate('owner');
  }

  async findOne(id: string) {
    if (!isValidObjectId(id)) {
      throw new BadRequestException('Invalid gym id');
    }
    const gym = await this.gymModel.findById(id);
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

  async getGymAnalytics(manager: Manager, start?: string, end?: string) {
    const gym = await this.gymModel.findOne({ owner: manager.id });
    if (!gym) {
      throw new NotFoundException('Gym not found');
    }

    const now = new Date();
    const lastMonthStart = startOfMonth(subMonths(now, 1));
    const lastMonthEnd = endOfMonth(subMonths(now, 1));
    const currentMonthStart = startOfMonth(now);

    // Fetch transactions for last month
    const lastMonthTransactions = await this.subscriptionInstanceModel
      .find({
        gym: new Types.ObjectId(gym.id),
        createdAt: { $gte: lastMonthStart, $lte: lastMonthEnd },
      })
      .populate('subscription');

    // Fetch transactions for current month
    const currentMonthTransactions = await this.subscriptionInstanceModel
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
    const transactions = await this.subscriptionInstanceModel
      .find({
        gym: new Types.ObjectId(gym.id),
        ...(start || end
          ? {
              createdAt: {
                ...(start ? { $gte: new Date(start) } : {}),
                ...(end ? { $lte: new Date(end) } : {}),
              },
            }
          : {}),
      })
      .populate('subscription');
    const totalRevenue = transactions.reduce((total, transaction) => {
      const amount =
        typeof transaction.paidAmount === 'number'
          ? transaction.paidAmount
          : transaction.subscription?.price || 0;
      return total + amount;
    }, 0);

    // Expenses in range
    const expenseFilter: any = { gym: new Types.ObjectId(gym.id) };
    if (start || end) {
      expenseFilter.date = {};
      if (start) expenseFilter.date.$gte = new Date(start);
      if (end) expenseFilter.date.$lte = new Date(end);
    }
    const expenses = await this.expenseModel.find(expenseFilter);
    const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    const totalMembers = await this.memberModel.countDocuments({ gym: gym.id });
    const members = await this.memberModel
      .find({ gym: gym.id })
      .populate('subscription')
      .populate('subscriptionInstances')
      .populate('gym');

    const membersWithActiveSubscription = members.map((member) => {
      const checkActiveSubscription = member.subscriptionInstances.some(
        (subscriptionInstance) => {
          return new Date(subscriptionInstance.endDate) > new Date();
        },
      );
      const latestSubscriptionInstance = member.subscriptionInstances.sort(
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
        subscriptionInstances: member.subscriptionInstances,
        gym: member.gym,
        hasActiveSubscription: checkActiveSubscription,
        currentActiveSubscription: latestSubscriptionInstance || null,
      };
    });

    // Determine the actual date range used
    const analyticsStartDate = start
      ? new Date(start)
      : startOfMonth(subMonths(now, 1));
    const analyticsEndDate = end ? new Date(end) : now;

    return {
      totalRevenue,
      totalExpenses,
      netRevenue: totalRevenue - totalExpenses,
      totalMembers,
      members: membersWithActiveSubscription,
      totalTransactions: transactions.length,
      revenueChange,
      memberChange,
      currentMonthMembers,
      currentMonthRevenue,
      currentMonthTransactions: currentMonthTransactions.length,
      dateRange: {
        startDate: analyticsStartDate,
        endDate: analyticsEndDate,
      },
    };
  }

  async getGymByGymName(gymName: string) {
    const gym = await this.gymModel
      .findOne({ gymDashedName: gymName })
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

  async getAllGyms() {
    const gyms = await this.gymModel.find().populate('owner');
    const data = await Promise.all(
      gyms.map(async (gym) => {
        const ownerSubscriptions = await this.ownerSubscriptionModel.find({
          owner: gym.owner?._id,
        });
        const gymHasActiveSubscription = ownerSubscriptions.find(
          (subscription) =>
            subscription.active && new Date(subscription.endDate) > new Date(),
        );
        return {
          ...gym.toJSON(),
          activeSubscription: gymHasActiveSubscription,
        };
      }),
    );
    const filterDataWithoutOwners = data.filter((gym) => gym.owner);
    return filterDataWithoutOwners;
  }

  async updateGymName(manager: Manager, gymName: string) {
    const gym = await this.gymModel.findOne({
      owner: manager.id,
    });
    if (!gym) {
      throw new NotFoundException('Gym not found');
    }
    gym.name = gymName;
    gym.gymDashedName = gymName.toLowerCase().split(' ').join('-');
    await gym.save();
    return gym;
  }

  async setGymFinishedPageSetup(manager: Manager) {
    const gym = await this.gymModel.findOne({
      owner: manager.id,
    });
    if (!gym) {
      throw new NotFoundException('Gym not found');
    }
    gym.finishedPageSetup = true;
    await gym.save();
    return gym;
  }

  async setWomensTimes(
    manager: Manager,
    womensTimes: { day: string; from: string; to: string }[],
  ) {
    const gym = await this.gymModel.findOne({ owner: manager.id });
    if (!gym) {
      throw new NotFoundException('Gym not found');
    }
    gym.womensTimes = womensTimes;
    await gym.save();
    return gym;
  }

  async updateGymNote(manager: Manager, note: string) {
    const gym = await this.gymModel.findOne({ owner: manager.id });
    if (!gym) {
      throw new NotFoundException('Gym not found');
    }
    gym.note = note;
    await gym.save();
    return gym;
  }

  async addGymMembersNotified(gymId: string, number: number) {
    const gym = await this.gymModel.findById(gymId);
    if (!gym) {
      throw new NotFoundException('Gym not found');
    }
    gym.membersNotified += number;
    await gym.save();
    return gym;
  }

  async getGymByManager(manager: Manager) {
    const gym = await this.gymModel.findOne({
      owner: manager.id,
    });
    return gym;
  }

  async getTransactionHistory(
    manager: Manager,
    limit: number,
    page: number,
    search: string,
  ) {
    const gym = await this.gymModel.findOne({
      owner: manager.id,
    });
    if (!gym) {
      throw new NotFoundException('Gym not found');
    }

    // First get member IDs that match the search
    let memberIds = [];
    if (search) {
      const matchingMembers = await this.memberModel.find({
        gym: gym.id,
        name: { $regex: search, $options: 'i' },
      });
      memberIds = matchingMembers.map((m) => m._id);
    }

    const result = await paginateModel(this.subscriptionInstanceModel, {
      filter: {
        gym: new Types.ObjectId(gym.id),
        ...(search ? { member: { $in: memberIds } } : {}),
      },
      populate: [{ path: 'subscription' }, { path: 'member' }, { path: 'gym' }],
      page,
      limit,
      sort: { createdAt: -1 }, // Sort by most recent first
    });

    return result;
  }

  async getGymAnalyticsByOwnerId(
    ownerId: string,
    start?: string,
    end?: string,
  ) {
    const gym = await this.gymModel.findOne({
      owner: ownerId,
    });
    if (!gym) {
      throw new NotFoundException('Gym not found');
    }

    const now = new Date();
    const lastMonthStart = startOfMonth(subMonths(now, 1));
    const lastMonthEnd = endOfMonth(subMonths(now, 1));
    const currentMonthStart = startOfMonth(now);

    const lastMonthTransactions = await this.subscriptionInstanceModel
      .find({
        gym: gym._id,
        createdAt: { $gte: lastMonthStart, $lte: lastMonthEnd },
      })
      .populate('subscription');
    const currentMonthTransactions = await this.subscriptionInstanceModel
      .find({
        gym: gym._id,
        createdAt: { $gte: currentMonthStart },
      })
      .populate('subscription');

    const lastMonthRevenue = lastMonthTransactions.reduce(
      (total, t) => total + (t.subscription?.price || 0),
      0,
    );
    const currentMonthRevenue = currentMonthTransactions.reduce(
      (total, t) => total + (t.subscription?.price || 0),
      0,
    );
    const revenueChange = lastMonthRevenue
      ? ((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100
      : 0;

    const lastMonthMembers = await this.memberModel.countDocuments({
      gym: gym._id,
      createdAt: { $gte: lastMonthStart, $lte: lastMonthEnd },
    });
    const currentMonthMembers = await this.memberModel.countDocuments({
      gym: gym._id,
      createdAt: { $gte: currentMonthStart },
    });
    const memberChange = lastMonthMembers
      ? ((currentMonthMembers - lastMonthMembers) / lastMonthMembers) * 100
      : 0;

    const transactions = await this.subscriptionInstanceModel
      .find({
        gym: gym._id,
        ...(start || end
          ? {
              createdAt: {
                ...(start ? { $gte: new Date(start) } : {}),
                ...(end ? { $lte: new Date(end) } : {}),
              },
            }
          : {}),
      })
      .populate('subscription');
    const totalRevenue = transactions.reduce((total, t) => {
      const amount =
        typeof t.paidAmount === 'number'
          ? t.paidAmount
          : t.subscription?.price || 0;
      return total + amount;
    }, 0);

    const expenseFilter: any = { gym: gym._id };
    if (start || end) {
      expenseFilter.date = {};
      if (start) expenseFilter.date.$gte = new Date(start);
      if (end) expenseFilter.date.$lte = new Date(end);
    }
    const expenses = await this.expenseModel.find(expenseFilter);
    const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    const totalMembers = await this.memberModel.countDocuments({
      gym: gym._id,
    });
    const members = await this.memberModel
      .find({ gym: gym._id })
      .populate('subscription')
      .populate('subscriptionInstances')
      .populate('gym');

    const membersWithActiveSubscription = members.map((member) => {
      const checkActiveSubscription = member.subscriptionInstances.some(
        (instance) => new Date(instance.endDate) > new Date(),
      );
      const latestSubscriptionInstance = member.subscriptionInstances.sort(
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
        subscriptionInstances: member.subscriptionInstances,
        gym: member.gym,
        hasActiveSubscription: checkActiveSubscription,
        currentActiveSubscription: latestSubscriptionInstance || null,
      };
    });

    const analyticsStartDate = start
      ? new Date(start)
      : startOfMonth(subMonths(now, 1));
    const analyticsEndDate = end ? new Date(end) : now;

    return {
      totalRevenue,
      totalExpenses,
      netRevenue: totalRevenue - totalExpenses,
      totalMembers,
      members: membersWithActiveSubscription,
      totalTransactions: transactions.length,
      revenueChange,
      memberChange,
      currentMonthMembers,
      currentMonthRevenue,
      currentMonthTransactions: currentMonthTransactions.length,
      dateRange: { startDate: analyticsStartDate, endDate: analyticsEndDate },
      gym,
    };
  }

  async getTransactionHistoryByOwnerId(
    ownerId: string,
    limit: number,
    page: number,
    search: string,
  ) {
    console.log(ownerId);
    const gym = await this.gymModel.findOne({
      owner: ownerId,
    });
    console.log(gym._id);
    if (!gym) {
      throw new NotFoundException('Owner subscription not found');
    }

    let memberIds: Types.ObjectId[] = [] as any;
    if (search) {
      const matchingMembers = await this.memberModel.find({
        gym: gym._id,
        name: { $regex: search, $options: 'i' },
      });
      memberIds = matchingMembers.map((m) => m._id as Types.ObjectId);
    }

    const result = await paginateModel(this.subscriptionInstanceModel, {
      filter: {
        gym: gym._id,
        ...(search ? { member: { $in: memberIds } } : {}),
      },
      populate: [{ path: 'subscription' }, { path: 'member' }, { path: 'gym' }],
      page,
      limit,
      sort: { createdAt: -1 },
    });

    return result;
  }

  async getMembersByOwnerId(
    ownerId: string,
    limit: number,
    page: number,
    search?: string,
  ) {
    const gym = await this.gymModel.findOne({
      owner: ownerId,
    });
    if (!gym) {
      throw new NotFoundException('Gym not found');
    }

    const filter: any = { gym: gym.id };
    if (search) {
      filter.name = { $regex: search, $options: 'i' };
    }

    const result = await paginateModel(this.memberModel as any, {
      filter,
      populate: [{ path: 'subscription' }, { path: 'subscriptionInstances' }],
      page,
      limit,
      sort: { createdAt: -1 },
    });

    return result;
  }

  async getGymOwnerSummary(ownerId: string) {
    const owner = await this.gymOwnerModel
      .findById(ownerId)
      .populate('gym')
      .populate('ownerSubscription');
    if (!owner) {
      throw new NotFoundException('Owner not found');
    }
    const gym = owner.gym;
    const activeOwnerSub = owner.ownerSubscription;
    return { owner, gym, activeOwnerSub };
  }
}
