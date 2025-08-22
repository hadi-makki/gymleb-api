import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { isMongoId } from 'class-validator';
import { CreateStaffDto } from './dto/create-staff.dto';
import { UpdateStaffDto } from './dto/update-staff.dto';
import { ManagerService } from 'src/manager/manager.service';
import { Manager } from 'src/manager/manager.entity';
import { v4 as uuidv4 } from 'uuid';
import { GymService } from 'src/gym/gym.service';
import { BadRequestException } from 'src/error/bad-request-error';
import { NotFoundException } from 'src/error/not-found-error';
import { Permissions } from 'src/decorators/roles/role.enum';
import { returnManager } from 'src/functions/returnUser';

@Injectable()
export class StaffService {
  constructor(
    private readonly managerService: ManagerService,
    private readonly gymService: GymService,
    @InjectModel(Manager.name)
    private readonly managerModel: Model<Manager>,
  ) {}

  async create(
    createStaffDto: CreateStaffDto,
    manager: Manager,
    gymId: string,
  ) {
    const created = await this.managerService.createManager(
      {
        username: createStaffDto.username,
        email: createStaffDto.email,
        password: createStaffDto.password,
        roles: createStaffDto.permissions,
        phoneNumber: createStaffDto.phoneNumber,
      },
      uuidv4(),
      gymId,
    );
    console.log('this is the created in create', created._id);

    const staffDoc = await this.managerModel.findById(created._id);
    console.log('this is the staffDoc in create', staffDoc);
    return returnManager(staffDoc);
  }

  async findAll(manager: Manager, gymId: string) {
    const gym = await this.gymService.getGymByManager(manager);
    if (!gym) {
      throw new NotFoundException('Gym not found');
    }

    const staff = await this.managerModel.find({
      gym: new Types.ObjectId(gymId),
      roles: { $ne: Permissions.GymOwner },
    });
    return staff.map((m) => returnManager(m as any));
  }

  async findOne(id: string, manager: Manager) {
    if (!isMongoId(id)) {
      throw new BadRequestException('Invalid id');
    }
    const gym = await this.gymService.getGymByManager(manager);
    if (!gym) {
      throw new NotFoundException('Gym not found');
    }
    const staff = await this.managerModel.findById(id);
    if (!staff || staff.gyms?.some((gym) => gym.id === gym.id)) {
      throw new NotFoundException('Staff not found');
    }
    return returnManager(staff as any);
  }

  async update(
    id: string,
    manager: Manager,
    gymId: string,
    updateStaffDto: UpdateStaffDto,
  ) {
    if (!isMongoId(id)) {
      throw new BadRequestException('Invalid id');
    }
    const gym = await this.gymService.getGymByManager(manager);
    if (!gym) {
      throw new NotFoundException('Gym not found');
    }
    const staff = await this.managerModel.findById(id);
    if (!staff || staff.gyms?.some((gym) => gym.id === gymId)) {
      throw new NotFoundException('Staff not found');
    }

    if (updateStaffDto.username)
      staff.username = updateStaffDto.username.trim();
    staff.email = updateStaffDto.email?.trim();
    if (updateStaffDto.password) {
      staff.password = await Manager.hashPassword(updateStaffDto.password);
    }
    if (updateStaffDto.permissions) staff.roles = updateStaffDto.permissions;
    if (updateStaffDto.phoneNumber)
      staff.phoneNumber = updateStaffDto.phoneNumber;
    await staff.save();
    return returnManager(staff as any);
  }

  async remove(id: string, manager: Manager, gymId: string) {
    if (!isMongoId(id)) {
      throw new BadRequestException('Invalid id');
    }
    const gym = await this.gymService.getGymByManager(manager);
    if (!gym) {
      throw new NotFoundException('Gym not found');
    }
    const staff = await this.managerModel.findById(id);
    if (!staff || staff.gyms?.some((gym) => gym.id === gymId)) {
      throw new NotFoundException('Staff not found');
    }
    await this.managerModel.deleteOne({ _id: new Types.ObjectId(id) });
    return { message: 'Staff removed successfully' } as any;
  }
}
