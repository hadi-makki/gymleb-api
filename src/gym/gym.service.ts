import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateGymDto } from './dto/create-gym.dto';
import { UpdateGymDto } from './dto/update-gym.dto';
import { Gym } from './entities/gym.entity';
import { GymOwner } from 'src/gym-owner/entities/gym-owner.entity';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class GymService {
  constructor(
    @InjectModel(Gym.name) private gymModel: Model<Gym>,
    @InjectModel(GymOwner.name) private gymOwnerModel: Model<GymOwner>,
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
    return await this.gymModel.find();
  }

  async findOne(id: string) {
    const gym = await this.gymModel.findById(id);
    if (!gym) {
      throw new NotFoundException('Gym not found');
    }
    return gym;
  }

  async update(id: string, updateGymDto: UpdateGymDto) {
    const gym = await this.gymModel.findByIdAndUpdate(id, updateGymDto, {
      new: true,
    });
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
}
