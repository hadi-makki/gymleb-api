import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { isMongoId, isUUID } from 'class-validator';
import { Permissions } from 'src/decorators/roles/role.enum';
import { BadRequestException } from 'src/error/bad-request-error';
import { NotFoundException } from 'src/error/not-found-error';
import { returnManager } from 'src/functions/returnUser';
import { GymEntity } from 'src/gym/entities/gym.entity';
import { GymService } from 'src/gym/gym.service';
import { ManagerEntity } from 'src/manager/manager.entity';
import { ManagerService } from 'src/manager/manager.service';
import { Not, Raw, Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { CreateStaffDto } from './dto/create-staff.dto';
import { UpdateStaffDto } from './dto/update-staff.dto';

@Injectable()
export class StaffService {
  constructor(
    private readonly managerService: ManagerService,
    private readonly gymService: GymService,
    @InjectRepository(ManagerEntity)
    private readonly managerModel: Repository<ManagerEntity>,
    @InjectRepository(GymEntity)
    private readonly gymModel: Repository<GymEntity>,
  ) {}

  async create(
    createStaffDto: CreateStaffDto,
    manager: ManagerEntity,
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

    const staffDoc = await this.managerModel.findOne({
      where: { id: created.id },
    });
    return returnManager(staffDoc);
  }

  async findAll(manager: ManagerEntity, gymId: string) {
    const gym = await this.gymService.getGymByManager(manager);
    if (!gym) {
      throw new NotFoundException('Gym not found');
    }

    console.log('gymId', gymId);

    const staff = await this.managerModel.find({
      where: {
        gyms: { id: gym.id },
        // permissions is jsonb[]; exclude owners via jsonb containment
        permissions: Raw(
          (alias) => `NOT (${alias} @> '["${Permissions.GymOwner}"]'::jsonb)`,
        ),
      },
    });
    console.log('staff', staff);
    return staff.map((m) => returnManager(m));
  }

  async findOne(id: string, manager: ManagerEntity) {
    if (!isUUID(id)) {
      throw new BadRequestException('Invalid id');
    }
    const gym = await this.gymService.getGymByManager(manager);
    if (!gym) {
      throw new NotFoundException('Gym not found');
    }
    const staff = await this.managerModel.findOne({
      where: { id },
    });
    if (!staff || staff.gyms?.some((gym) => gym.id === gym.id)) {
      throw new NotFoundException('Staff not found');
    }
    return returnManager(staff as any);
  }

  async update(
    id: string,
    manager: ManagerEntity,
    gymId: string,
    updateStaffDto: UpdateStaffDto,
  ) {
    if (!isUUID(id)) {
      throw new BadRequestException('Invalid id');
    }
    const gym = await this.gymService.getGymByManager(manager);
    if (!gym) {
      throw new NotFoundException('Gym not found');
    }
    const staff = await this.managerModel.findOne({
      where: { id },
    });
    if (!staff || staff.gyms?.some((gym) => gym.id === gymId)) {
      throw new NotFoundException('Staff not found');
    }

    if (updateStaffDto.username)
      staff.username = updateStaffDto.username.trim();
    staff.email = updateStaffDto.email?.trim();
    if (updateStaffDto.password) {
      staff.password = await ManagerEntity.hashPassword(
        updateStaffDto.password,
      );
    }
    if (updateStaffDto.permissions)
      staff.permissions = updateStaffDto.permissions;
    if (updateStaffDto.phoneNumber)
      staff.phoneNumber = updateStaffDto.phoneNumber;
    await this.managerModel.save(staff);
    return returnManager(staff as any);
  }

  async remove(id: string, manager: ManagerEntity, gymId: string) {
    if (!isUUID(id)) {
      throw new BadRequestException('Invalid id');
    }
    const gym = await this.gymService.getGymByManager(manager);
    if (!gym) {
      throw new NotFoundException('Gym not found');
    }
    const staff = await this.managerModel.findOne({
      where: { id },
    });
    if (!staff || staff.gyms?.some((gym) => gym.id === gymId)) {
      throw new NotFoundException('Staff not found');
    }
    await this.managerModel.delete(id);

    return { message: 'Staff removed successfully' } as any;
  }
}
