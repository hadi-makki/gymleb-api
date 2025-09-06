// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { endOfMonth, startOfMonth, subMonths } from 'date-fns';
import { ExpenseEntity } from 'src/expenses/expense.entity';
import { GymEntity } from 'src/gym/entities/gym.entity';
import { MemberEntity } from 'src/member/entities/member.entity';
import { TransactionEntity } from 'src/transactions/transaction.entity';
import { Between, Raw, Repository } from 'typeorm';
import { BadRequestException } from '../error/bad-request-error';
import { NotFoundException } from '../error/not-found-error';
import { returnManager } from '../functions/returnUser';
import { GymService } from '../gym/gym.service';
import { SuccessMessageReturn } from '../main-classes/success-message-return';
import { TokenService } from '../token/token.service';
import { CreateManagerDto } from './dtos/create-manager.dto';
import { LoginManagerDto } from './dtos/login-manager.dto';
import { ManagerCreatedWithTokenDto } from './dtos/manager-created-with-token.dto';
import { ManagerCreatedDto } from './dtos/manager-created.dto';
import { UpdateManagerDto } from './dtos/update-manager.sto';
import { UpdateShiftTimesDto } from './dto/update-shift-times.dto';
import { ManagerEntity } from './manager.entity';
import { Permissions } from 'src/decorators/roles/role.enum';
import { isUUID } from 'class-validator';
@Injectable()
export class ManagerService {
  constructor(
    @InjectRepository(ManagerEntity)
    private readonly managerEntity: Repository<ManagerEntity>,
    private readonly tokenService: TokenService,
    private readonly GymService: GymService,
    @InjectRepository(GymEntity)
    private readonly gymModel: Repository<GymEntity>,
    @InjectRepository(MemberEntity)
    private readonly memberModel: Repository<MemberEntity>,
    @InjectRepository(ExpenseEntity)
    private readonly expenseModel: Repository<ExpenseEntity>,
    @InjectRepository(TransactionEntity)
    private readonly transactionModel: Repository<TransactionEntity>,
  ) {}

  async createManager(
    body: CreateManagerDto,
    deviceId: string,
    gymId: string,
  ): Promise<ManagerCreatedWithTokenDto> {
    const checkEmail = await this.managerEntity.exists({
      where: {
        email: body.email,
      },
    });
    if (checkEmail && body.email) {
      throw new BadRequestException('User with this email already exists');
    }
    const checkUsername = await this.managerEntity.exists({
      where: {
        username: body.username,
      },
    });
    if (checkUsername) {
      throw new BadRequestException('User with this username already exists');
    }

    const checkGym = await this.gymModel.findOne({
      where: { id: gymId },
    });
    if (!checkGym) {
      throw new NotFoundException('Gym not found');
    }

    const hashedPassword = await ManagerEntity.hashPassword(body.password);
    const savedManager = this.managerEntity.create({
      ...(body.email && { email: body.email.trim().toLowerCase() }),
      password: hashedPassword,
      username: body.username.trim(),
      permissions: body.roles,
      phoneNumber: body.phoneNumber,
      gyms: [checkGym],
    });

    await this.managerEntity.save(savedManager);

    const token = await this.tokenService.generateTokens({
      managerId: savedManager.id,
      userId: null,
      deviceId,
    });

    return {
      ...returnManager(savedManager),
      token: token.accessToken,
    };
  }

  async createPersonalTrainer(
    body: CreateManagerDto,
    deviceId: string,
    gymId: string,
    firstName: string,
    lastName: string,
  ): Promise<ManagerCreatedWithTokenDto> {
    const checkEmail = await this.managerEntity.exists({
      where: {
        email: body.email,
      },
    });
    if (checkEmail && body.email) {
      throw new BadRequestException('User with this email already exists');
    }
    const checkUsername = await this.managerEntity.exists({
      where: {
        username: body.username,
      },
    });
    if (checkUsername) {
      throw new BadRequestException('User with this username already exists');
    }

    const checkGym = await this.gymModel.findOne({
      where: { id: gymId },
    });
    if (!checkGym) {
      throw new NotFoundException('Gym not found');
    }
    const hashedPassword = await ManagerEntity.hashPassword(body.password);
    const savedManagerModel = this.managerEntity.create({
      ...(body.email && { email: body.email.trim().toLowerCase() }),
      password: hashedPassword,
      username: body.username.trim(),
      permissions: body.roles,
      phoneNumber: body.phoneNumber,
      firstName,
      lastName,
      gyms: [checkGym],
    });

    const savedManager = await this.managerEntity.save(savedManagerModel);

    const token = await this.tokenService.generateTokens({
      managerId: savedManager.id,
      userId: null,
      deviceId,
    });

    return {
      ...returnManager(savedManager),
      token: token.accessToken,
    };
  }

  async findOne(id: string): Promise<ManagerCreatedDto> {
    if (!isUUID(id)) {
      throw new BadRequestException('Invalid id');
    }
    const manager = await this.managerEntity.findOne({
      where: { id },
    });
    if (!manager) {
      throw new NotFoundException('Manager not found');
    }
    return returnManager(manager);
  }

  async login(
    body: LoginManagerDto,
    deviceId: string,
  ): Promise<ManagerCreatedWithTokenDto> {
    const manager = await this.managerEntity.findOne({
      where: [{ username: body.username }, { email: body.username }],
    });
    if (!manager) {
      throw new NotFoundException('User not found');
    }

    console.log('manager', manager);

    const isPasswordMatch = await ManagerEntity.isPasswordMatch(
      body.password,
      manager.password,
    );

    console.log('isPasswordMatch', isPasswordMatch);
    if (!isPasswordMatch) {
      throw new BadRequestException('Password is incorrect');
    }
    const token = await this.tokenService.generateTokens({
      managerId: manager.id,
      userId: null,
      deviceId,
    });
    //   ?.token;
    return {
      ...returnManager(manager),
      token: token.accessToken,
    };
  }

  async getAll(): Promise<ManagerCreatedDto[]> {
    const managers = await this.managerEntity.find({});
    return managers.map((manager) => returnManager(manager));
  }

  async deleteManager(
    id: string,
    deviceId: string,
  ): Promise<SuccessMessageReturn> {
    const manager = await this.managerEntity.findOne({
      where: { id },
    });
    if (!manager) {
      throw new NotFoundException('Manager not found');
    }
    await this.managerEntity.delete(id);

    await this.gymModel.delete(id);
    // await this.ownerSubscriptionModel.update(id, { owner: null });
    await this.transactionModel.delete(id);
    await this.memberModel.delete(id);
    await this.expenseModel.delete(id);
    await this.tokenService.deleteTokensByUserId(id, deviceId);

    return {
      message: 'Manager deleted successfully',
    };
  }

  async updateManager(
    id: string,
    body: UpdateManagerDto,
  ): Promise<ManagerCreatedDto> {
    const manager = await this.managerEntity.findOne({
      where: { id },
    });
    if (!manager) {
      throw new NotFoundException('Manager not found');
    }

    if (body.email) manager.email = body.email;
    if (body.firstName) manager.firstName = body.firstName;
    if (body.lastName) manager.lastName = body.lastName;
    if (body.username) manager.username = body.username;
    if (body.phoneNumber) manager.phoneNumber = body.phoneNumber;
    if (body.password) {
      const hashedPassword = await ManagerEntity.hashPassword(body.password);
      manager.password = hashedPassword;
    }
    await this.managerEntity.save(manager);
    return returnManager(manager);
  }

  async logout(
    user: ManagerEntity,
    deviceId: string,
  ): Promise<SuccessMessageReturn> {
    await this.tokenService.deleteTokensByUserId(user.id, deviceId);
    return {
      message: 'Manager logged out successfully',
    };
  }

  async getAdminAnalytics(start?: string, end?: string) {
    const now = new Date();
    const lastMonthStart = startOfMonth(subMonths(now, 1));
    const lastMonthEnd = endOfMonth(subMonths(now, 1));
    const currentMonthStart = startOfMonth(now);

    const baseFilter: any = { isOwnerSubscriptionAssignment: true };

    const transactions = await this.transactionModel.find({
      where: {
        ...baseFilter,
        ...(start || end
          ? {
              createdAt: Between(start, end),
            }
          : {}),
      },
      relations: ['owner', 'ownerSubscriptionType'],
    });

    const totalRevenue = transactions.reduce(
      (sum, t) => sum + (t.paidAmount || 0),
      0,
    );
    const totalTransactions = transactions.length;
    const ownersSet = new Set(
      transactions
        .map(
          (t) => t.owner?.toString?.() || (t.owner as any)?._id?.toString?.(),
        )
        .filter(Boolean),
    );
    const ownersCount = ownersSet.size;

    const lastMonthTransactions = await this.transactionModel.find({
      ...baseFilter,
      createdAt: { $gte: lastMonthStart, $lte: lastMonthEnd },
    });
    const currentMonthTransactions = await this.transactionModel.find({
      ...baseFilter,
      createdAt: { $gte: currentMonthStart },
    });

    const lastMonthRevenue = lastMonthTransactions.reduce(
      (sum, t) => sum + (t.paidAmount || 0),
      0,
    );
    const currentMonthRevenue = currentMonthTransactions.reduce(
      (sum, t) => sum + (t.paidAmount || 0),
      0,
    );
    const revenueChange = lastMonthRevenue
      ? ((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100
      : 0;

    return {
      totalRevenue,
      totalTransactions,
      ownersCount,
      revenueChange,
      currentMonthRevenue,
      currentMonthTransactions: currentMonthTransactions.length,
    };
  }

  async getExtendedAdminAnalytics() {
    // Get basic analytics
    const basicAnalytics = await this.getAdminAnalytics();

    // Get all gyms with their subscription status
    const gyms = await this.gymModel.find({
      relations: ['owner', 'ownerSubscriptionType'],
    });

    let gymsWithActiveSubscriptions = 0;
    let totalMessagesSent = 0;

    // Check each gym's subscription status and count messages
    for (const gym of gyms) {
      if (gym.owner) {
        // Check if gym has active subscription
        const activeSubscription =
          await this.GymService.getGymActiveSubscription(gym);
        if (activeSubscription.activeSubscription) {
          gymsWithActiveSubscriptions++;
        }

        // Count messages sent by this gym (membersNotified + welcomeMessageNotified)
        totalMessagesSent +=
          (gym.membersNotified || 0) + (gym.welcomeMessageNotified || 0);
      }
    }

    return {
      ...basicAnalytics,
      gymsWithActiveSubscriptions,
      totalMessagesSent,
      totalGyms: gyms.length,
    };
  }

  async getRevenueChartData(months: number = 12) {
    const now = new Date();
    const chartData = [];

    for (let i = months - 1; i >= 0; i--) {
      const monthStart = startOfMonth(subMonths(now, i));
      const monthEnd = endOfMonth(subMonths(now, i));

      const transactions = await this.transactionModel.find({
        where: {
          isOwnerSubscriptionAssignment: true,
          createdAt: Between(monthStart, monthEnd),
        },
      });

      const revenue = transactions.reduce(
        (sum, t) => sum + (t.paidAmount || 0),
        0,
      );

      chartData.push({
        month: monthStart.toLocaleDateString('en-US', {
          month: 'short',
          year: 'numeric',
        }),
        revenue: revenue,
        transactions: transactions.length,
      });
    }

    return chartData;
  }

  async getMessagesChartData(months: number = 12) {
    const now = new Date();
    const chartData = [];

    for (let i = months - 1; i >= 0; i--) {
      const monthStart = startOfMonth(subMonths(now, i));
      const monthEnd = endOfMonth(subMonths(now, i));

      // Get gyms created in this month and sum their message counts
      const gyms = await this.gymModel.find({
        where: {
          createdAt: Between(monthStart, monthEnd),
        },
      });

      const messagesSent = gyms.reduce(
        (sum, gym) =>
          sum + (gym.membersNotified || 0) + (gym.welcomeMessageNotified || 0),
        0,
      );

      chartData.push({
        month: monthStart.toLocaleDateString('en-US', {
          month: 'short',
          year: 'numeric',
        }),
        messages: messagesSent,
        gyms: gyms.length,
      });
    }

    return chartData;
  }

  async getSubscriptionStatusData() {
    const gyms = await this.gymModel.find({
      relations: ['owner', 'ownerSubscriptionType'],
    });

    let activeCount = 0;
    let expiredCount = 0;
    let noSubscriptionCount = 0;

    for (const gym of gyms) {
      if (gym.owner) {
        const activeSubscription =
          await this.GymService.getGymActiveSubscription(gym);
        if (activeSubscription.activeSubscription) {
          activeCount++;
        } else if (activeSubscription.lastSubscription) {
          expiredCount++;
        } else {
          noSubscriptionCount++;
        }
      } else {
        noSubscriptionCount++;
      }
    }

    return [
      { status: 'Active', count: activeCount, color: '#10b981' },
      { status: 'Expired', count: expiredCount, color: '#f59e0b' },
      {
        status: 'No Subscription',
        count: noSubscriptionCount,
        color: '#ef4444',
      },
    ];
  }

  async getMe(manager: ManagerEntity): Promise<ManagerCreatedDto> {
    const checkManager = await this.managerEntity.findOne({
      where: { id: manager.id },
      relations: {
        ownedGyms: true,
        gyms: true,
        transactions: true,
      },
    });

    if (!checkManager) {
      throw new NotFoundException('Manager not found');
    }
    return returnManager(checkManager);
  }

  async getAllGymOwners() {
    const gymOwners = await this.managerEntity.find({
      // where: {
      //   permissions: Raw(
      //     (alias) => `NOT (${alias} @> '["${Permissions.GymOwner}"]'::jsonb)`,
      //   ),
      // },
    });
    console.log('gymOwners', gymOwners);
    return gymOwners
      .filter((gymOwner) => gymOwner.permissions.includes(Permissions.GymOwner))
      .map((gymOwner) => returnManager(gymOwner));
  }

  async updateShiftTimes(
    managerId: string,
    updateShiftTimesDto: UpdateShiftTimesDto,
  ) {
    if (!isUUID(managerId)) {
      throw new BadRequestException('Invalid manager ID format');
    }

    const manager = await this.managerEntity.findOne({
      where: { id: managerId },
    });

    if (!manager) {
      throw new NotFoundException('Manager not found');
    }

    // Update shift times if provided
    if (updateShiftTimesDto.shiftStartTime !== undefined) {
      manager.shiftStartTime = updateShiftTimesDto.shiftStartTime;
    }
    if (updateShiftTimesDto.shiftEndTime !== undefined) {
      manager.shiftEndTime = updateShiftTimesDto.shiftEndTime;
    }

    await this.managerEntity.save(manager);

    return {
      message: 'Shift times updated successfully',
      data: {
        id: manager.id,
        shiftStartTime: manager.shiftStartTime,
        shiftEndTime: manager.shiftEndTime,
      },
    };
  }
}
