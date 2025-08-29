import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateGymDto } from './dto/create-gym.dto';
import { UpdateGymDto } from './dto/update-gym.dto';
import { subMonths, startOfMonth, endOfMonth, subDays } from 'date-fns';
import { AddOfferDto } from './dto/add-offer.dto';
import { GymEntity } from './entities/gym.entity';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Between,
  ILike,
  In,
  LessThanOrEqual,
  Like,
  MoreThanOrEqual,
  Repository,
} from 'typeorm';
import { MemberEntity } from 'src/member/entities/member.entity';
import { ManagerEntity } from 'src/manager/manager.entity';
import { OwnerSubscriptionEntity } from 'src/owner-subscriptions/owner-subscription.entity';
import {
  TransactionEntity,
  TransactionType,
} from 'src/transactions/transaction.entity';
import { paginate, FilterOperator } from 'nestjs-paginate';

@Injectable()
export class GymService {
  constructor(
    @InjectRepository(GymEntity)
    private gymModel: Repository<GymEntity>,
    @InjectRepository(ManagerEntity)
    private gymOwnerModel: Repository<ManagerEntity>,
    @InjectRepository(MemberEntity)
    private memberModel: Repository<MemberEntity>,
    @InjectRepository(OwnerSubscriptionEntity)
    private ownerSubscriptionModel: Repository<OwnerSubscriptionEntity>,
    @InjectRepository(ManagerEntity)
    private managerModel: Repository<ManagerEntity>,
    @InjectRepository(TransactionEntity)
    private transactionModel: Repository<TransactionEntity>,
  ) {}

  async create(createGymDto: CreateGymDto) {
    const checkGym = await this.gymModel.findOne({
      where: { name: createGymDto.name },
    });
    if (checkGym) {
      throw new BadRequestException('Gym already exists');
    }
    const gymOwner = await this.gymOwnerModel.findOne({
      where: { id: createGymDto.gymOwner },
    });
    if (!gymOwner) {
      throw new NotFoundException('Gym owner not found');
    }
    const gym = this.gymModel.create(createGymDto);
    gym.owner = gymOwner;
    return this.gymModel.save(gym);
  }

  async findAll() {
    return await this.gymModel.find({
      relations: ['owner'],
    });
  }

  async findOne(id: string) {
    const gym = await this.gymModel.findOne({
      where: { id },
    });
    if (!gym) {
      throw new NotFoundException('Gym not found');
    }
    return gym;
  }

  async remove(id: string) {
    const gym = await this.gymModel.delete(id);
    if (!gym) {
      throw new NotFoundException('Gym not found');
    }
    return gym;
  }

  async getGymAnalytics(
    manager: ManagerEntity,
    start?: string,
    end?: string,
    gymId?: string,
  ) {
    const gym = await this.gymModel.findOne({
      where: { id: gymId },
    });
    if (!gym) {
      throw new NotFoundException('Gym not found');
    }

    const now = new Date();
    const lastMonthStart = startOfMonth(subMonths(now, 1));
    const lastMonthEnd = endOfMonth(subMonths(now, 1));
    const currentMonthStart = startOfMonth(now);

    // Build date filter for the specified range
    const dateFilter: any = {};
    if (start || end) {
      if (start && end) {
        dateFilter.createdAt = Between(new Date(start), new Date(end));
        return;
      }
      if (start) {
        dateFilter.createdAt = MoreThanOrEqual(new Date(start));
      }
      if (end) {
        dateFilter.createdAt = LessThanOrEqual(new Date(end));
      }
    }

    // Fetch all transactions for the gym in the specified range
    const allTransactions = await this.transactionModel.find({
      where: { gym: { id: gym.id }, isPaid: true, ...dateFilter },
      relations: ['subscription', 'revenue', 'expense', 'ptSession'],
    });

    // Fetch transactions for last month comparison
    const lastMonthTransactions = await this.transactionModel.find({
      where: [
        {
          gym: {
            id: gym.id,
          },
          isPaid: true,
          createdAt: MoreThanOrEqual(lastMonthStart),
        },
        {
          gym: {
            id: gym.id,
          },
          isPaid: true,
          createdAt: LessThanOrEqual(lastMonthEnd),
        },
      ],
      relations: ['subscription', 'revenue', 'expense'],
    });

    // Fetch transactions for current month comparison
    const currentMonthTransactions = await this.transactionModel.find({
      where: {
        gym: {
          id: gym.id,
        },
        isPaid: true,
        createdAt: MoreThanOrEqual(currentMonthStart),
      },
      relations: ['subscription', 'revenue', 'expense'],
    });

    // Calculate subscription revenue for both periods
    const lastMonthSubscriptionRevenue = lastMonthTransactions
      .filter((t) => t.type === TransactionType.SUBSCRIPTION)
      .reduce((total, transaction) => total + (transaction.paidAmount || 0), 0);

    const currentMonthSubscriptionRevenue = currentMonthTransactions
      .filter((t) => t.type === TransactionType.SUBSCRIPTION)
      .reduce((total, transaction) => total + (transaction.paidAmount || 0), 0);

    // Calculate personal trainer session revenue for current month
    const currentMonthPTSessionRevenue = currentMonthTransactions
      .filter((t) => t.type === TransactionType.PERSONAL_TRAINER_SESSION)
      .reduce((total, transaction) => {
        const sessionAmount = transaction.paidAmount || 0;
        const gymPercentage = transaction.gymsPTSessionPercentage || 0;
        const gymShare = (gymPercentage / 100) * sessionAmount;
        return total + gymShare;
      }, 0);

    console.log(
      'this is the current month p t session revenue',
      currentMonthPTSessionRevenue,
    );

    // Calculate percentage change in subscription revenue
    const revenueChange = lastMonthSubscriptionRevenue
      ? ((currentMonthSubscriptionRevenue - lastMonthSubscriptionRevenue) /
          lastMonthSubscriptionRevenue) *
        100
      : 0;

    // Fetch member count for both periods
    const lastMonthMembers = await this.memberModel.count({
      where: [
        {
          gym: {
            id: gym.id,
          },
          createdAt: MoreThanOrEqual(lastMonthStart),
        },
        {
          gym: {
            id: gym.id,
          },
          createdAt: LessThanOrEqual(lastMonthEnd),
        },
      ],
    });
    const currentMonthMembers = await this.memberModel.count({
      where: {
        gym: {
          id: gym.id,
        },
        createdAt: MoreThanOrEqual(currentMonthStart),
      },
    });

    // Calculate percentage change in members
    const memberChange = lastMonthMembers
      ? ((currentMonthMembers - lastMonthMembers) / lastMonthMembers) * 100
      : 0;

    // Calculate totals from all transactions
    const subscriptionRevenue = allTransactions
      .filter((t) => t.type === TransactionType.SUBSCRIPTION)
      .reduce((total, transaction) => total + (transaction.paidAmount || 0), 0);

    // Calculate personal trainer session revenue based on gym percentage
    const personalTrainerSessionRevenue = allTransactions
      .filter((t) => t.type === TransactionType.PERSONAL_TRAINER_SESSION)
      .reduce((total, transaction) => {
        const sessionAmount = transaction.paidAmount || 0;
        const gymPercentage = transaction.gymsPTSessionPercentage || 0;
        // Calculate gym's share: (percentage / 100) * session amount
        const gymShare = (gymPercentage / 100) * sessionAmount;
        return total + gymShare;
      }, 0);

    const additionalRevenue = allTransactions
      .filter((t) => t.type === TransactionType.REVENUE)
      .reduce(
        (total, transaction) => total + (transaction.paidAmount || 0),
        personalTrainerSessionRevenue,
      );

    const totalExpenses = allTransactions
      .filter((t) => t.type === TransactionType.EXPENSE)
      .reduce((total, transaction) => total + (transaction.paidAmount || 0), 0);

    const totalRevenue =
      subscriptionRevenue + additionalRevenue + personalTrainerSessionRevenue;
    const netRevenue = totalRevenue - totalExpenses;

    const totalMembers = await this.memberModel.count({
      where: {
        gym: {
          id: gym.id,
        },
      },
    });
    const members = await this.memberModel.find({
      where: { gym: { id: gym.id } },
      relations: ['subscription', 'transactions', 'gym'],
      order: { createdAt: 'DESC' },
    });

    const membersWithActiveSubscription = members.map((member) => {
      const checkActiveSubscription = member.transactions.some(
        (transaction) => {
          return new Date(transaction.endDate) > new Date();
        },
      );
      const latestSubscriptionInstance = member.transactions.sort(
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
        subscriptionTransactions: member.transactions,
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
      subscriptionRevenue,
      additionalRevenue,
      personalTrainerSessionRevenue,
      totalExpenses,
      netRevenue,
      totalMembers,
      members: membersWithActiveSubscription,
      totalTransactions: allTransactions.length,
      revenueChange,
      memberChange,
      currentMonthMembers,
      currentMonthRevenue:
        currentMonthSubscriptionRevenue + currentMonthPTSessionRevenue,
      currentMonthSubscriptionRevenue,
      currentMonthPTSessionRevenue,
      currentMonthTransactions: currentMonthTransactions.filter(
        (t) => t.type === TransactionType.SUBSCRIPTION,
      ).length,
      dateRange: {
        startDate: analyticsStartDate,
        endDate: analyticsEndDate,
      },
    };
  }

  async getGymByGymName(gymName: string) {
    const gym = await this.gymModel.findOne({
      where: { gymDashedName: gymName },
    });

    if (!gym) {
      throw new NotFoundException('Gym not found');
    }
    return gym;
  }

  async getGymById(gymId: string) {
    const gym = await this.gymModel.findOne({
      where: { id: gymId },
    });
    if (!gym) {
      throw new NotFoundException('Gym not found');
    }
    return gym;
  }

  async updateGymDay(gymId: string, dayToUpdate: string) {
    const gym = await this.gymModel.findOne({
      where: { id: gymId },
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
    return this.gymModel.save(gym);
  }

  async getAllGyms() {
    const gyms = await this.gymModel.find({
      relations: ['owner'],
    });
    const data = await Promise.all(
      gyms.map(async (gym) => {
        const ownerSubscriptions = await this.ownerSubscriptionModel.find({
          where: {
            owner: gym.owner,
          },
        });
        const gymHasActiveSubscription = ownerSubscriptions.find(
          (subscription) =>
            subscription.active && new Date(subscription.endDate) > new Date(),
        );
        return {
          ...gym,
          activeSubscription: gymHasActiveSubscription,
        };
      }),
    );
    const filterDataWithoutOwners = data.filter((gym) => gym.owner);
    return filterDataWithoutOwners;
  }

  async updateGymName(gymId: string, gymName: string) {
    const gym = await this.gymModel.findOne({
      where: { id: gymId },
    });
    if (!gym) {
      throw new NotFoundException('Gym not found');
    }
    gym.name = gymName;
    gym.gymDashedName = gymName.toLowerCase().split(' ').join('-');
    await this.gymModel.save(gym);
    return gym;
  }

  async setGymFinishedPageSetup(manager: ManagerEntity, gymId: string) {
    const gym = await this.gymModel.findOne({
      where: { id: gymId },
    });
    if (!gym) {
      throw new NotFoundException('Gym not found');
    }
    gym.finishedPageSetup = true;
    await this.gymModel.save(gym);
    return gym;
  }

  async setWomensTimes(
    gymId: string,
    womensTimes: { day: string; from: string; to: string }[],
  ) {
    const gym = await this.gymModel.findOne({
      where: { id: gymId },
    });
    if (!gym) {
      throw new NotFoundException('Gym not found');
    }
    gym.womensTimes = womensTimes;
    await this.gymModel.save(gym);
    return gym;
  }

  async updateGymNote(gymId: string, note: string) {
    const gym = await this.gymModel.findOne({
      where: { id: gymId },
    });
    if (!gym) {
      throw new NotFoundException('Gym not found');
    }
    gym.note = note;
    await this.gymModel.save(gym);
    return gym;
  }

  async updatePTSessionPercentage(gymId: string, percentage: number) {
    const gym = await this.gymModel.findOne({
      where: { id: gymId },
    });
    if (!gym) {
      throw new NotFoundException('Gym not found');
    }
    if (percentage < 0 || percentage > 100) {
      throw new BadRequestException('Percentage must be between 0 and 100');
    }
    gym.gymsPTSessionPercentage = percentage;
    await this.gymModel.save(gym);
    return gym;
  }

  async addGymMembersNotified(gymId: string, number: number) {
    const gym = await this.gymModel.findOne({
      where: { id: gymId },
    });
    if (!gym) {
      throw new NotFoundException('Gym not found');
    }
    gym.membersNotified += number;
    await this.gymModel.save(gym);
    return gym;
  }

  async getGymByManager(manager: ManagerEntity) {
    const gym = await this.gymModel.findOne({
      where: { owner: { id: manager.id } },
    });
    return gym;
  }

  async getTransactionHistory(
    manager: ManagerEntity,
    limit: number,
    page: number,
    search: string,
    type: TransactionType,
    gymId: string,
  ) {
    const gym = await this.gymModel.findOne({
      where: { id: gymId },
    });
    if (!gym) {
      throw new NotFoundException('Gym not found');
    }

    // First get member IDs that match the search
    let memberIds = [];
    if (search) {
      const matchingMembers = await this.memberModel.find({
        where: { gym: { id: gym.id }, name: ILike(`%${search}%`) },
      });
      memberIds = matchingMembers.map((m) => m.id);
    }

    return paginate(
      {
        page,
        limit,
        search: search || undefined,
        path: '/gyms/admin/:ownerId/transactions',
      },
      this.transactionModel,
      {
        relations: [
          'subscription',
          'member',
          'gym',
          'product',
          'revenue',
          'expense',
        ],
        sortableColumns: ['createdAt', 'updatedAt', 'paidAmount', 'type'],
        searchableColumns: ['title', 'paidBy'],
        defaultSortBy: [['createdAt', 'DESC']],
        where: {
          gym: { id: gym.id },
          ...(search ? { member: { id: In(memberIds) } } : {}),
          ...(type ? { type: type as TransactionType } : {}),
        },
        filterableColumns: { type: [FilterOperator.EQ] },
        maxLimit: 100,
      },
    );
  }

  async getGymAnalyticsByOwnerId(
    ownerId: string,
    start?: string,
    end?: string,
  ) {
    const gym = await this.gymModel.findOne({
      where: { owner: { id: ownerId } },
    });
    if (!gym) {
      throw new NotFoundException('Gym not found');
    }

    const now = new Date();
    const lastMonthStart = startOfMonth(subMonths(now, 1));
    const lastMonthEnd = endOfMonth(subMonths(now, 1));
    const currentMonthStart = startOfMonth(now);

    // Build date filter for the specified range
    const dateFilter: any = {};
    if (start || end) {
      dateFilter.createdAt = {};
      if (start) dateFilter.createdAt.$gte = new Date(start);
      if (end) dateFilter.createdAt.$lte = new Date(end);
    }

    // Fetch all transactions for the gym in the specified range
    const allTransactions = await this.transactionModel.find({
      where: { gym: { id: gym.id }, ...dateFilter },
      relations: ['subscription', 'revenue', 'expense'],
    });

    // Fetch transactions for last month comparison
    const lastMonthTransactions = await this.transactionModel.find({
      where: [
        {
          gym: { id: gym.id },
          createdAt: MoreThanOrEqual(lastMonthStart),
          isPaid: true,
        },
        {
          gym: { id: gym.id },
          createdAt: LessThanOrEqual(lastMonthEnd),
          isPaid: true,
        },
      ],
      relations: ['subscription', 'revenue', 'expense'],
    });

    // Fetch transactions for current month comparison
    const currentMonthTransactions = await this.transactionModel.find({
      where: {
        gym: { id: gym.id },
        createdAt: MoreThanOrEqual(currentMonthStart),
        isPaid: true,
      },
      relations: ['subscription', 'revenue', 'expense'],
    });

    // Calculate subscription revenue for both periods
    const lastMonthSubscriptionRevenue = lastMonthTransactions
      .filter((t) => t.type === TransactionType.SUBSCRIPTION)
      .reduce((total, transaction) => total + (transaction.paidAmount || 0), 0);

    const currentMonthSubscriptionRevenue = currentMonthTransactions
      .filter((t) => t.type === TransactionType.SUBSCRIPTION)
      .reduce((total, transaction) => total + (transaction.paidAmount || 0), 0);

    // Calculate percentage change in subscription revenue
    const revenueChange = lastMonthSubscriptionRevenue
      ? ((currentMonthSubscriptionRevenue - lastMonthSubscriptionRevenue) /
          lastMonthSubscriptionRevenue) *
        100
      : 0;

    const lastMonthMembers = await this.memberModel.count({
      where: [
        {
          gym: { id: gym.id },
          createdAt: MoreThanOrEqual(lastMonthStart),
        },
        {
          gym: { id: gym.id },
          createdAt: LessThanOrEqual(lastMonthEnd),
        },
      ],
    });
    const currentMonthMembers = await this.memberModel.count({
      where: {
        gym: { id: gym.id },
        createdAt: MoreThanOrEqual(currentMonthStart),
      },
    });
    const memberChange = lastMonthMembers
      ? ((currentMonthMembers - lastMonthMembers) / lastMonthMembers) * 100
      : 0;

    // Calculate totals from all transactions
    const subscriptionRevenue = allTransactions
      .filter((t) => t.type === TransactionType.SUBSCRIPTION)
      .reduce((total, transaction) => total + (transaction.paidAmount || 0), 0);

    const additionalRevenue = allTransactions
      .filter((t) => t.type === TransactionType.REVENUE)
      .reduce((total, transaction) => total + (transaction.paidAmount || 0), 0);

    const totalExpenses = allTransactions
      .filter((t) => t.type === TransactionType.EXPENSE)
      .reduce((total, transaction) => total + (transaction.paidAmount || 0), 0);

    const totalRevenue = subscriptionRevenue + additionalRevenue;
    const netRevenue = totalRevenue - totalExpenses;

    const totalMembers = await this.memberModel.count({
      where: {
        gym: { id: gym.id },
      },
    });
    const members = await this.memberModel.find({
      where: {
        gym: { id: gym.id },
      },
      relations: ['subscription', 'transactions', 'gym'],
    });

    const membersWithActiveSubscription = members.map((member) => {
      const checkActiveSubscription = member.transactions.some(
        (transaction) => new Date(transaction.endDate) > new Date(),
      );
      const latestSubscriptionInstance = member.transactions.sort(
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
        subscriptionTransactions: member.transactions,
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
      subscriptionRevenue,
      additionalRevenue,
      totalExpenses,
      netRevenue,
      totalMembers,
      members: membersWithActiveSubscription,
      totalTransactions: allTransactions.length,
      revenueChange,
      memberChange,
      currentMonthMembers,
      currentMonthRevenue: currentMonthSubscriptionRevenue,
      currentMonthTransactions: currentMonthTransactions.filter(
        (t) => t.type === TransactionType.SUBSCRIPTION,
      ).length,
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
    const gym = await this.gymModel.findOne({
      where: { owner: { id: ownerId } },
    });
    if (!gym) {
      throw new NotFoundException('Owner subscription not found');
    }

    let memberIds: string[] = [] as any;
    if (search) {
      const matchingMembers = await this.memberModel.find({
        where: {
          gym: { id: gym.id },
          name: ILike(`%${search}%`),
        },
      });
      memberIds = matchingMembers.map((m) => m.id);
    }

    return paginate(
      {
        page,
        limit,
        search: search || undefined,
        path: '/gyms/admin/:ownerId/transactions',
      },
      this.transactionModel,
      {
        relations: [
          'subscription',
          'member',
          'gym',
          'product',
          'revenue',
          'expense',
        ],
        sortableColumns: ['createdAt', 'updatedAt', 'paidAmount', 'type'],
        searchableColumns: ['title', 'paidBy'],
        defaultSortBy: [['createdAt', 'DESC']],
        where: {
          gym: { id: gym.id },
          ...(search ? { member: { id: In(memberIds) } } : {}),
        },
        filterableColumns: { type: [FilterOperator.EQ] },
        maxLimit: 100,
      },
    );
  }

  async getMembersByOwnerId(
    ownerId: string,
    limit: number,
    page: number,
    search?: string,
  ) {
    const gym = await this.gymModel.findOne({
      where: { owner: { id: ownerId } },
    });
    if (!gym) {
      throw new NotFoundException('Gym not found');
    }

    const filter: any = { gym: { id: gym.id } };
    if (search) {
      filter.name = ILike(`%${search}%`);
    }

    return paginate(
      {
        page,
        limit,
        search: search || undefined,
        path: '/gyms/admin/:ownerId/members',
      },
      this.memberModel,
      {
        relations: ['subscription', 'transactions'],
        sortableColumns: ['createdAt', 'updatedAt', 'name', 'phone'],
        searchableColumns: ['name', 'phone', 'email'],
        defaultSortBy: [['createdAt', 'DESC']],
        where: filter,
        filterableColumns: {
          name: [FilterOperator.ILIKE],
          phone: [FilterOperator.ILIKE],
          email: [FilterOperator.ILIKE],
        },
        maxLimit: 100,
      },
    );
  }

  async getGymOwnerSummary(ownerId: string) {
    const owner = await this.gymOwnerModel.findOne({
      where: { id: ownerId },
      relations: ['gyms', 'ownerSubscription'],
    });
    if (!owner) {
      throw new NotFoundException('Owner not found');
    }
    const gym = owner.gyms[0];
    const activeOwnerSub = owner.ownerSubscription;
    return { owner, gym, activeOwnerSub };
  }

  async addGymOffer(gymId: string, { offers }: AddOfferDto) {
    const gym = await this.gymModel.findOne({
      where: { id: gymId },
    });
    if (!gym) {
      throw new NotFoundException('Gym not found');
    }
    gym.offers = offers.map((offer) => ({ description: offer.description }));
    await this.gymModel.save(gym);
    return gym;
  }

  async getGymsByOwner(ownerId: string) {
    const gyms = await this.gymModel.find({
      where: { owner: { id: ownerId } },
      relations: ['owner'],
    });
    return gyms;
  }

  async getGymAnalyticsByOwnerIdAndGymId(
    gymId: string,
    start?: string,
    end?: string,
  ) {
    const gym = await this.gymModel.findOne({
      where: { id: gymId },
    });
    if (!gym) {
      throw new NotFoundException('Gym not found');
    }

    const now = new Date();
    const lastMonthStart = startOfMonth(subMonths(now, 1));
    const lastMonthEnd = endOfMonth(subMonths(now, 1));
    const currentMonthStart = startOfMonth(now);

    // Build date filter for the specified range
    const dateFilter: any = {};
    if (start || end) {
      dateFilter.createdAt = {};
      if (start) dateFilter.createdAt.$gte = new Date(start);
      if (end) dateFilter.createdAt.$lte = new Date(end);
    }

    // Fetch all transactions for the gym in the specified range
    const allTransactions = await this.transactionModel.find({
      where: {
        gym: { id: gym.id },
        ...dateFilter,
      },
      relations: ['subscription', 'revenue', 'expense'],
    });

    // Fetch transactions for last month comparison
    const lastMonthTransactions = await this.transactionModel.find({
      where: [
        {
          gym: { id: gym.id },
          createdAt: MoreThanOrEqual(lastMonthStart),
        },
        {
          gym: { id: gym.id },
          createdAt: LessThanOrEqual(lastMonthEnd),
        },
      ],
      relations: ['subscription', 'revenue', 'expense'],
    });

    // Fetch transactions for current month comparison
    const currentMonthTransactions = await this.transactionModel.find({
      where: {
        gym: { id: gym.id },
        createdAt: MoreThanOrEqual(currentMonthStart),
      },
      relations: ['subscription', 'revenue', 'expense'],
    });

    // Calculate subscription revenue for both periods
    const lastMonthSubscriptionRevenue = lastMonthTransactions
      .filter((t) => t.type === TransactionType.SUBSCRIPTION)
      .reduce((total, transaction) => total + (transaction.paidAmount || 0), 0);

    const currentMonthSubscriptionRevenue = currentMonthTransactions
      .filter((t) => t.type === TransactionType.SUBSCRIPTION)
      .reduce((total, transaction) => total + (transaction.paidAmount || 0), 0);

    // Calculate percentage change in subscription revenue
    const revenueChange = lastMonthSubscriptionRevenue
      ? ((currentMonthSubscriptionRevenue - lastMonthSubscriptionRevenue) /
          lastMonthSubscriptionRevenue) *
        100
      : 0;

    const lastMonthMembers = await this.memberModel.count({
      where: [
        {
          gym: { id: gym.id },
          createdAt: MoreThanOrEqual(lastMonthStart),
        },
        {
          gym: { id: gym.id },
          createdAt: LessThanOrEqual(lastMonthEnd),
        },
      ],
    });
    const currentMonthMembers = await this.memberModel.count({
      where: {
        gym: { id: gym.id },
        createdAt: MoreThanOrEqual(currentMonthStart),
      },
    });
    const memberChange = lastMonthMembers
      ? ((currentMonthMembers - lastMonthMembers) / lastMonthMembers) * 100
      : 0;

    // Calculate totals from all transactions
    const subscriptionRevenue = allTransactions
      .filter((t) => t.type === TransactionType.SUBSCRIPTION)
      .reduce((total, transaction) => total + (transaction.paidAmount || 0), 0);

    const additionalRevenue = allTransactions
      .filter((t) => t.type === TransactionType.REVENUE)
      .reduce((total, transaction) => total + (transaction.paidAmount || 0), 0);

    const totalExpenses = allTransactions
      .filter((t) => t.type === TransactionType.EXPENSE)
      .reduce((total, transaction) => total + (transaction.paidAmount || 0), 0);

    const totalRevenue = subscriptionRevenue + additionalRevenue;
    const netRevenue = totalRevenue - totalExpenses;

    const totalMembers = await this.memberModel.count({
      where: {
        gym: { id: gym.id },
      },
    });
    const members = await this.memberModel.find({
      where: {
        gym: { id: gym.id },
      },
      relations: ['subscription', 'transactions', 'gym'],
    });

    const membersWithActiveSubscription = members.map((member) => {
      const checkActiveSubscription = member.transactions.some(
        (transaction) => new Date(transaction.endDate) > new Date(),
      );
      const latestSubscriptionInstance = member.transactions.sort(
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
        subscriptionTransactions: member.transactions,
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
      subscriptionRevenue,
      additionalRevenue,
      totalExpenses,
      netRevenue,
      totalMembers,
      members: membersWithActiveSubscription,
      totalTransactions: allTransactions.length,
      revenueChange,
      memberChange,
      currentMonthMembers,
      currentMonthRevenue: currentMonthSubscriptionRevenue,
      currentMonthTransactions: currentMonthTransactions.filter(
        (t) => t.type === TransactionType.SUBSCRIPTION,
      ).length,
      dateRange: { startDate: analyticsStartDate, endDate: analyticsEndDate },
      gym,
    };
  }

  async getGymTransactions(
    gymId: string,
    limit: number = 20,
    page: number = 1,
    search?: string,
  ) {
    const checkGym = await this.gymModel.findOne({
      where: { id: gymId },
    });
    if (!checkGym) {
      throw new NotFoundException('Gym not found');
    }

    console.log('this is the gym id', checkGym.transactions.length);

    return paginate(
      {
        page,
        limit,
        search: search || undefined,
        path: '/gyms/admin/:ownerId/transactions',
      },
      this.transactionModel,
      {
        relations: ['member', 'subscription', 'gym', 'revenue', 'expense'],
        sortableColumns: ['createdAt', 'updatedAt', 'paidAmount', 'type'],
        searchableColumns: ['title', 'paidBy'],
        defaultSortBy: [['createdAt', 'DESC']],
        where: { gym: { id: checkGym.id } },
        filterableColumns: { type: [FilterOperator.EQ] },
        maxLimit: 100,
      },
    );
  }

  async getGymMembers(
    gymId: string,
    limit: number = 20,
    page: number = 1,
    search?: string,
  ) {
    return paginate(
      {
        page,
        limit,
        search: search || undefined,
        path: '/gyms/admin/:ownerId/members',
      },
      this.memberModel,
      {
        relations: ['gym', 'subscription', 'transactions'],
        sortableColumns: ['createdAt', 'updatedAt', 'name', 'phone'],
        searchableColumns: ['name', 'phone', 'email'],
        defaultSortBy: [['createdAt', 'DESC']],
        where: {
          gym: { id: gymId },
          ...(search ? { name: Like(`%${search}%`) } : {}),
        },
        filterableColumns: {
          name: [FilterOperator.ILIKE],
          phone: [FilterOperator.ILIKE],
          email: [FilterOperator.ILIKE],
        },
        maxLimit: 100,
      },
    );
  }

  async getGymRevenueGraphData(
    gymId: string,
    start?: string,
    end?: string,
    isMobile?: boolean,
  ): Promise<{
    data: {
      date: string;
      revenue: number;
      transactions: number;
    }[];
    startDate: Date;
    endDate: Date;
  }> {
    if (!gymId) {
      throw new BadRequestException('Gym ID is required');
    }

    const gym = await this.gymModel.findOne({
      where: { id: gymId },
    });
    if (!gym) {
      throw new NotFoundException('Gym not found');
    }

    const endDate = end ? new Date(end) : new Date();
    const startDate = start
      ? new Date(start)
      : subDays(new Date(), isMobile ? 7 : 30);

    const transactions = await this.transactionModel.find({
      where: [
        {
          gym: { id: gym.id },
          createdAt: MoreThanOrEqual(startDate),
          isPaid: true,
        },
        {
          gym: { id: gym.id },
          createdAt: LessThanOrEqual(endDate),
          isPaid: true,
        },
      ],
      relations: ['member'],
      order: { createdAt: 'ASC' },
    });

    // Group transactions by date
    const revenueByDate = new Map();
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const dateKey = currentDate.toISOString().split('T')[0];
      revenueByDate.set(dateKey, {
        date: dateKey,
        revenue: 0,
        transactions: 0,
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Aggregate net revenue by date (revenue - expenses)
    transactions.forEach((transaction) => {
      const dateKey = transaction.createdAt.toISOString().split('T')[0];
      const existing = revenueByDate.get(dateKey);
      if (existing) {
        const amount = transaction.paidAmount || 0;

        // For expenses, subtract the amount (negative impact on revenue)
        // For revenue/subscription, add the amount (positive impact on revenue)
        if (transaction.type === TransactionType.EXPENSE) {
          existing.revenue -= amount;
        } else {
          existing.revenue += amount;
        }

        existing.transactions += 1;
      }
    });

    return {
      data: Array.from(revenueByDate.values()),
      startDate,
      endDate,
    };
  }

  async getGymMemberGrowthGraphData(
    gymId: string,
    start?: string,
    end?: string,
    isMobile?: boolean,
  ): Promise<{
    data: {
      date: string;
      newMembers: number;
      cumulativeMembers: number;
    }[];
    startDate: Date;
    endDate: Date;
  }> {
    if (!gymId) {
      throw new BadRequestException('Gym ID is required');
    }

    const gym = await this.gymModel.findOne({
      where: { id: gymId },
    });
    if (!gym) {
      throw new NotFoundException('Gym not found');
    }

    const endDate = end ? new Date(end) : new Date();
    const startDate = start
      ? new Date(start)
      : subDays(new Date(), isMobile ? 7 : 30);

    const members = await this.memberModel.find({
      where: [
        {
          gym: { id: gym.id },
          createdAt: MoreThanOrEqual(startDate),
        },
        {
          gym: { id: gym.id },
          createdAt: LessThanOrEqual(endDate),
        },
      ],
      order: { createdAt: 'ASC' },
    });

    // Group members by date
    const membersByDate = new Map();
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const dateKey = currentDate.toISOString().split('T')[0];
      membersByDate.set(dateKey, {
        date: dateKey,
        newMembers: 0,
        cumulativeMembers: 0,
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Count new members by date
    members.forEach((member) => {
      const dateKey = member.createdAt.toISOString().split('T')[0];
      const existing = membersByDate.get(dateKey);
      if (existing) {
        existing.newMembers += 1;
      }
    });

    // Calculate cumulative members
    let cumulative = 0;
    const result = Array.from(membersByDate.values()).map((item) => {
      cumulative += item.newMembers;
      return {
        ...item,
        cumulativeMembers: cumulative,
      };
    });

    return {
      data: result,
      startDate,
      endDate,
    };
  }

  async getGymTransactionTrendsGraphData(
    gymId: string,
    start?: string,
    end?: string,
    isMobile?: boolean,
  ): Promise<{
    data: {
      date: string;
      subscriptions: number;
      revenues: number;
      expenses: number;
      total: number;
    }[];
    startDate: Date;
    endDate: Date;
  }> {
    if (!gymId) {
      throw new BadRequestException('Gym ID is required');
    }

    const gym = await this.gymModel.findOne({
      where: { id: gymId },
    });
    if (!gym) {
      throw new NotFoundException('Gym not found');
    }

    const endDate = end ? new Date(end) : new Date();
    const startDate = start
      ? new Date(start)
      : subDays(new Date(), isMobile ? 7 : 30);

    const transactions = await this.transactionModel.find({
      where: [
        {
          gym: { id: gym.id },
          createdAt: MoreThanOrEqual(startDate),
        },
        {
          gym: { id: gym.id },
          createdAt: LessThanOrEqual(endDate),
        },
      ],
      relations: ['member'],
      order: { createdAt: 'ASC' },
    });

    // Group transactions by date and type
    const transactionsByDate = new Map();
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const dateKey = currentDate.toISOString().split('T')[0];
      transactionsByDate.set(dateKey, {
        date: dateKey,
        subscriptions: 0,
        revenues: 0,
        expenses: 0,
        total: 0,
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Aggregate transactions by date and type
    transactions.forEach((transaction) => {
      const dateKey = transaction.createdAt.toISOString().split('T')[0];
      const existing = transactionsByDate.get(dateKey);
      if (existing) {
        const amount = transaction.paidAmount || 0;
        existing.total += 1;

        switch (transaction.type) {
          case TransactionType.SUBSCRIPTION:
            existing.subscriptions += 1;
            break;
          case TransactionType.REVENUE:
            existing.revenues += 1;
            break;
          case TransactionType.EXPENSE:
            existing.expenses += 1;
            break;
        }
      }
    });

    return {
      data: Array.from(transactionsByDate.values()),
      startDate,
      endDate,
    };
  }

  async deleteGym(gymId: string) {
    const gym = await this.gymModel.findOne({
      where: { id: gymId },
    });
    if (!gym) {
      throw new NotFoundException('Gym not found');
    }
    await this.gymModel.remove(gym);
    return { message: 'Gym deleted successfully' };
  }
}
