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
@Injectable()
export class GymOwnerService {
  constructor(
    @InjectModel('GymOwner') private readonly gymOwnerModel: Model<GymOwner>,
  ) {}

  async create(createGymOwnerDto: CreateGymOwnerDto) {
    const checkGymOwner = await this.gymOwnerModel.findOne({
      email: createGymOwnerDto.email,
    });
    if (checkGymOwner) {
      throw new BadRequestException('Gym owner already exists');
    }
    const gymOwner = await this.gymOwnerModel.create(createGymOwnerDto);
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
