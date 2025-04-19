import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateGymOwnerDto } from './dto/create-gym-owner.dto';
import { UpdateGymOwnerDto } from './dto/update-gym-owner.dto';
import { GymOwner } from './entities/gym-owner.entity';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Manager } from 'src/manager/manager.entity';
import { Role } from 'src/decorators/roles/role.enum';
@Injectable()
export class GymOwnerService {
  constructor(
    @InjectModel(Manager.name)
    private readonly gymOwnerModel: Model<Manager>,
  ) {}

  async create(createGymOwnerDto: CreateGymOwnerDto) {
    const checkGymOwner = await this.gymOwnerModel.findOne({
      email: createGymOwnerDto.email,
    });
    if (checkGymOwner) {
      throw new BadRequestException('Gym owner already exists');
    }
    const gymOwner = await this.gymOwnerModel.create({
      ...createGymOwnerDto,
      roles: [Role.GymOwner],
    });
    return gymOwner;
  }

  async findAll() {
    const gymOwners = await this.gymOwnerModel.find();
    return gymOwners;
  }

  async findOne(id: string) {
    const gymOwner = await this.gymOwnerModel.findById(id);
    if (!gymOwner) {
      throw new NotFoundException('Gym owner not found');
    }
    return gymOwner;
  }

  async update(id: string, updateGymOwnerDto: UpdateGymOwnerDto) {
    const gymOwner = await this.gymOwnerModel.findByIdAndUpdate(
      id,
      updateGymOwnerDto,
      {
        new: true,
      },
    );
    if (!gymOwner) {
      throw new NotFoundException('Gym owner not found');
    }
    return gymOwner;
  }

  async remove(id: string) {
    const gymOwner = await this.gymOwnerModel.findByIdAndDelete(id);
    if (!gymOwner) {
      throw new NotFoundException('Gym owner not found');
    }
    return gymOwner;
  }
}
