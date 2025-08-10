// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isMongoId } from 'class-validator';
import { endOfMonth, startOfMonth, subMonths } from 'date-fns';
import { Model, Types } from 'mongoose';
import { Expense } from 'src/expenses/expense.entity';
import { Gym } from 'src/gym/entities/gym.entity';
import { GymService } from 'src/gym/gym.service';
import { Member } from 'src/member/entities/member.entity';
import { OwnerSubscription } from 'src/owner-subscriptions/owner-subscription.entity';
import { SubscriptionInstance } from 'src/transactions/subscription-instance.entity';
import { BadRequestException } from '../error/bad-request-error';
import { NotFoundException } from '../error/not-found-error';
import { returnManager } from '../functions/returnUser';
import { SuccessMessageReturn } from '../main-classes/success-message-return';
import { TokenService } from '../token/token.service';
import { CreateManagerDto } from './dtos/create-manager.dto';
import { LoginManagerDto } from './dtos/login-manager.dto';
import { ManagerCreatedWithTokenDto } from './dtos/manager-created-with-token.dto';
import { ManagerCreatedDto } from './dtos/manager-created.dto';
import { UpdateManagerDto } from './dtos/update-manager.sto';
import { Manager } from './manager.entity';
@Injectable()
export class ManagerService {
  constructor(
    @InjectModel(Manager.name)
    private readonly managerEntity: Model<Manager>,
    private readonly tokenService: TokenService,
    private readonly GymService: GymService,
    @InjectModel(SubscriptionInstance.name)
    private readonly subscriptionInstanceModel: Model<SubscriptionInstance>,
    @InjectModel(Gym.name)
    private readonly gymModel: Model<Gym>,
    @InjectModel(OwnerSubscription.name)
    private readonly ownerSubscriptionModel: Model<OwnerSubscription>,
    @InjectModel(Member.name)
    private readonly memberModel: Model<Member>,
    @InjectModel(Expense.name)
    private readonly expenseModel: Model<Expense>,
  ) {}

  async createManager(
    body: CreateManagerDto,
  ): Promise<ManagerCreatedWithTokenDto> {
    const manager = await this.managerEntity.findOne({
      $or: [{ email: body.email }, { username: body.username }],
    });
    if (manager) {
      throw new BadRequestException(
        'User with this email or username already exists',
      );
    }

    const hashedPassword = await Manager.hashPassword(body.password);
    const savedManager = await this.managerEntity.create({
      email: body.email.trim().toLowerCase(),
      password: hashedPassword,
      username: body.username.trim(),
      roles: body.roles,
    });

    const token = await this.tokenService.generateTokens({
      managerId: savedManager.id,
      userId: null,
    });
    return {
      ...returnManager(savedManager),
      token: token.accessToken,
    };
  }

  async findOne(id: string): Promise<ManagerCreatedDto> {
    if (!isMongoId(id)) {
      throw new BadRequestException('Invalid id');
    }
    const manager = await this.managerEntity.findById(id);
    if (!manager) {
      throw new NotFoundException('Manager not found');
    }
    return returnManager(manager);
  }

  async login(body: LoginManagerDto): Promise<ManagerCreatedWithTokenDto> {
    const manager = await this.managerEntity.findOne({
      $or: [{ username: body.username }, { email: body.username }],
    });
    if (!manager) {
      throw new NotFoundException('User not found');
    }

    const isPasswordMatch = await Manager.isPasswordMatch(
      body.password,
      manager.password,
    );
    if (!isPasswordMatch) {
      throw new BadRequestException('Password is incorrect');
    }
    const token = await this.tokenService.generateTokens({
      managerId: manager.id,
      userId: null,
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

  async deleteManager(id: string): Promise<SuccessMessageReturn> {
    const manager = await this.managerEntity.findById(id);
    if (!manager) {
      throw new NotFoundException('Manager not found');
    }
    await this.managerEntity.deleteOne({ _id: new Types.ObjectId(id) });

    await this.gymModel.deleteOne({ owner: id });
    await this.ownerSubscriptionModel.updateMany(
      { owner: id },
      { owner: null },
    );
    await this.subscriptionInstanceModel.deleteMany({ owner: id });
    await this.memberModel.deleteMany({ owner: id });
    await this.expenseModel.deleteMany({ owner: id });
    await this.tokenService.deleteTokensByUserId(id);

    return {
      message: 'Manager deleted successfully',
    };
  }

  async updateManager(
    id: string,
    body: UpdateManagerDto,
  ): Promise<ManagerCreatedDto> {
    const manager = await this.managerEntity.findById(id);
    if (!manager) {
      throw new NotFoundException('Manager not found');
    }

    if (body.email) manager.email = body.email;
    if (body.firstName) manager.firstName = body.firstName;
    if (body.lastName) manager.lastName = body.lastName;
    if (body.username) manager.username = body.username;
    if (body.password) {
      const hashedPassword = await Manager.hashPassword(body.password);
      console.log('this is the hashed password', hashedPassword);
      manager.password = hashedPassword;
    }
    await manager.save();
    return returnManager(manager);
  }

  async logout(user: Manager): Promise<SuccessMessageReturn> {
    console.log('logging out a manager');
    await this.tokenService.deleteTokensByUserId(user.id);
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

    const subscriptionInstances = await this.subscriptionInstanceModel
      .find({
        ...baseFilter,
        ...(start || end
          ? {
              createdAt: {
                ...(start ? { $gte: new Date(start) } : {}),
                ...(end ? { $lte: new Date(end) } : {}),
              },
            }
          : {}),
      })
      .populate('owner')
      .populate('ownerSubscriptionType');

    const totalRevenue = subscriptionInstances.reduce(
      (sum, t) => sum + (t.paidAmount || 0),
      0,
    );
    const totalTransactions = subscriptionInstances.length;
    const ownersSet = new Set(
      subscriptionInstances
        .map(
          (t) => t.owner?.toString?.() || (t.owner as any)?._id?.toString?.(),
        )
        .filter(Boolean),
    );
    const ownersCount = ownersSet.size;

    const lastMonthSubscriptionInstances =
      await this.subscriptionInstanceModel.find({
        ...baseFilter,
        createdAt: { $gte: lastMonthStart, $lte: lastMonthEnd },
      });
    const currentMonthSubscriptionInstances =
      await this.subscriptionInstanceModel.find({
        ...baseFilter,
        createdAt: { $gte: currentMonthStart },
      });

    const lastMonthRevenue = lastMonthSubscriptionInstances.reduce(
      (sum, t) => sum + (t.paidAmount || 0),
      0,
    );
    const currentMonthRevenue = currentMonthSubscriptionInstances.reduce(
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
      currentMonthTransactions: currentMonthSubscriptionInstances.length,
    };
  }

  async getMe(manager: Manager): Promise<ManagerCreatedDto> {
    const checkManager = await this.managerEntity
      .findById(manager.id)
      .populate('gym');

    if (!checkManager) {
      throw new NotFoundException('Manager not found');
    }
    return returnManager(checkManager);
  }
}
