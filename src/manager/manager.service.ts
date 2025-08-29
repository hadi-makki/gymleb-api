// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isMongoId } from 'class-validator';
import { endOfMonth, startOfMonth, subMonths } from 'date-fns';
import { Model, Types } from 'mongoose';
import { BadRequestException } from '../error/bad-request-error';
import { NotFoundException } from '../error/not-found-error';
import { Expense } from '../expenses/expense.model';
import { returnManager } from '../functions/returnUser';
import { Gym } from '../gym/entities/gym.model';
import { GymService } from '../gym/gym.service';
import { SuccessMessageReturn } from '../main-classes/success-message-return';
import { Member } from '../member/entities/member.model';
import { OwnerSubscription } from '../owner-subscriptions/owner-subscription.model';
import { TokenService } from '../token/token.service';
import { Transaction } from '../transactions/transaction.model';
import { CreateManagerDto } from './dtos/create-manager.dto';
import { LoginManagerDto } from './dtos/login-manager.dto';
import { ManagerCreatedWithTokenDto } from './dtos/manager-created-with-token.dto';
import { ManagerCreatedDto } from './dtos/manager-created.dto';
import { UpdateManagerDto } from './dtos/update-manager.sto';
import { Manager } from './manager.model';
import { ManagerEntity } from './manager.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThanOrEqual, MoreThanOrEqual, Repository } from 'typeorm';
import { GymEntity } from 'src/gym/entities/gym.entity';
import { OwnerSubscriptionEntity } from 'src/owner-subscriptions/owner-subscription.entity';
import { MemberEntity } from 'src/member/entities/member.entity';
import { ExpenseEntity } from 'src/expenses/expense.entity';
import { TransactionEntity } from 'src/transactions/transaction.entity';
@Injectable()
export class ManagerService {
  constructor(
    @InjectRepository(ManagerEntity)
    private readonly managerEntity: Repository<ManagerEntity>,
    private readonly tokenService: TokenService,
    private readonly GymService: GymService,
    @InjectRepository(GymEntity)
    private readonly gymModel: Repository<GymEntity>,
    @InjectRepository(OwnerSubscriptionEntity)
    private readonly ownerSubscriptionModel: Repository<OwnerSubscriptionEntity>,
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

    const hashedPassword = await Manager.hashPassword(body.password);
    const savedManager = this.managerEntity.create({
      ...(body.email && { email: body.email.trim().toLowerCase() }),
      password: hashedPassword,
      username: body.username.trim(),
      permissions: body.roles,
      phoneNumber: body.phoneNumber,
    });

    savedManager.gyms.push(checkGym);
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
    const hashedPassword = await Manager.hashPassword(body.password);
    const savedManagerModel = this.managerEntity.create({
      ...(body.email && { email: body.email.trim().toLowerCase() }),
      password: hashedPassword,
      username: body.username.trim(),
      permissions: body.roles,
      phoneNumber: body.phoneNumber,
      firstName,
      lastName,
    });

    savedManagerModel.gyms.push(checkGym);
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
    if (!isMongoId(id)) {
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
    await this.ownerSubscriptionModel.update(id, { owner: null });
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
    if (body.password) {
      const hashedPassword = await Manager.hashPassword(body.password);
      manager.password = hashedPassword;
    }
    await this.managerEntity.save(manager);
    return returnManager(manager);
  }

  async logout(user: Manager, deviceId: string): Promise<SuccessMessageReturn> {
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
      where: [
        {
          ...baseFilter,
          ...(start || end
            ? {
                createdAt: MoreThanOrEqual(start),
              }
            : {}),
        },
        {
          ...baseFilter,
          ...(start || end
            ? {
                createdAt: LessThanOrEqual(end),
              }
            : {}),
        },
      ],
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

  async getMe(manager: Manager): Promise<ManagerCreatedDto> {
    const checkManager = await this.managerEntity.findOne({
      where: { id: manager.id },
      relations: {
        ownedGyms: true,
      },
    });

    if (!checkManager) {
      throw new NotFoundException('Manager not found');
    }
    return returnManager(checkManager);
  }
}
