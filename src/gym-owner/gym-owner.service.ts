import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateGymOwnerDto } from './dto/create-gym-owner.dto';
import { UpdateGymOwnerDto } from './dto/update-gym-owner.dto';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Manager } from '../manager/manager.entity';
import { Role } from '../decorators/roles/role.enum';
import { Gym } from '../gym/entities/gym.entity';
import { Days } from '../seeder/gym.seeding';
@Injectable()
export class GymOwnerService {
  constructor(
    @InjectModel(Manager.name)
    private readonly gymOwnerModel: Model<Manager>,
    @InjectModel(Gym.name)
    private readonly gymModel: Model<Gym>,
  ) {}

  async create(createGymOwnerDto: CreateGymOwnerDto) {
    console.log('createGymOwnerDto', createGymOwnerDto);
    const checkGymOwner = await this.gymOwnerModel.findOne({
      email: createGymOwnerDto.email,
    });
    if (checkGymOwner) {
      throw new BadRequestException('Gym owner already exists');
    }

    let username =
      createGymOwnerDto.firstName.toLowerCase() +
      createGymOwnerDto.lastName.toLowerCase();

    const checkUsername = await this.gymOwnerModel.findOne({
      username,
    });
    if (checkUsername) {
      username = username + Math.floor(1000 + Math.random() * 9000);
    }
    const gymOwner = await this.gymOwnerModel.create({
      firstName: createGymOwnerDto.firstName,
      lastName: createGymOwnerDto.lastName,
      email: createGymOwnerDto.email,
      password: await Manager.hashPassword(createGymOwnerDto.password),
      address: createGymOwnerDto.address,
      phone: createGymOwnerDto.phone,
      username,
      roles: [Role.GymOwner],
    });
    let gymName =
      createGymOwnerDto.firstName + ' ' + createGymOwnerDto.lastName;
    const checkGymName = await this.gymModel.findOne({
      name: gymName,
    });
    if (checkGymName) {
      gymName = gymName + Math.floor(1000 + Math.random() * 9000);
    }

    const checkGym = await this.gymModel.create({
      name: gymName,
      address: createGymOwnerDto.address,
      phone: createGymOwnerDto.phone,
      email: createGymOwnerDto.email,
      password: createGymOwnerDto.password,
      openingDays: Days,
      owner: gymOwner.id,
      gymDashedName: gymName.toLowerCase().split(' ').join('-'),
    });
    gymOwner.gym = checkGym.id;
    await gymOwner.save();

    const gym = await this.gymModel.findById(checkGym.id).populate('owner');

    return gym;
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
