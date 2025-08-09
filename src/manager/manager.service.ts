// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isMongoId, isUUID } from 'class-validator';
import { Model } from 'mongoose';
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
import { GymOwner } from '../gym-owner/entities/gym-owner.entity';
@Injectable()
export class ManagerService {
  constructor(
    @InjectModel(Manager.name)
    private readonly managerEntity: Model<Manager>,
    private readonly tokenService: TokenService,
    @InjectModel(GymOwner.name)
    private readonly gymOwnerEntity: Model<GymOwner>,
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
    await this.managerEntity.deleteOne({ id });

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

    if (body.email !== undefined) manager.email = body.email;
    if (body.username !== undefined) manager.username = body.username;
    if (body.password) {
      manager.password = await Manager.hashPassword(body.password);
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
