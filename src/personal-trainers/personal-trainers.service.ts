import { BadRequestException, Injectable } from '@nestjs/common';
import { CreatePersonalTrainerDto } from './dto/create-personal-trainer.dto';
import { UpdatePersonalTrainerDto } from './dto/update-personal-trainer.dto';
import { PersonalTrainer } from './entities/personal-trainer.entity';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Role } from '../decorators/roles/role.enum';
import { User } from '../user/user.entity';
import { AddPersonalTrainerDto } from './dto/add-personal-trainer.dto';
import { NotFoundException } from '../error/not-found-error';

@Injectable()
export class PersonalTrainersService {
  constructor(
    @InjectModel(PersonalTrainer.name)
    private readonly personalTrainerEntity: Model<PersonalTrainer>,
    @InjectModel(User.name)
    private readonly userEntity: Model<User>,
  ) {}

  async create(createPersonalTrainerDto: CreatePersonalTrainerDto) {
    const personalTrainer = await this.personalTrainerEntity.create({
      name: createPersonalTrainerDto.name,
      email: createPersonalTrainerDto.email,
      password: createPersonalTrainerDto.password,
      users: createPersonalTrainerDto.users,
      roles: [Role.ReadUsers],
    });
    return personalTrainer;
  }

  findAll() {
    return this.personalTrainerEntity.find();
  }

  findOne(id: string) {
    return this.personalTrainerEntity.findById(id);
  }

  update(id: string, updatePersonalTrainerDto: UpdatePersonalTrainerDto) {
    return this.personalTrainerEntity.findByIdAndUpdate(
      id,
      updatePersonalTrainerDto,
    );
  }

  remove(id: string) {
    return this.personalTrainerEntity.findByIdAndDelete(id);
  }

  findAllUsers(personalTrainer: PersonalTrainer) {
    return this.userEntity.find({ personalTrainer: personalTrainer._id });
  }

  async addUserToPersonalTrainer(
    addPersonalTrainerDto: AddPersonalTrainerDto,
    personalTrainer: PersonalTrainer,
  ) {
    const user = await this.userEntity.findById(addPersonalTrainerDto.userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const checkIfUserIsAlreadyInPersonalTrainer =
      await this.personalTrainerEntity.findOne({
        users: { $in: [user._id] },
      });

    if (checkIfUserIsAlreadyInPersonalTrainer) {
      throw new BadRequestException('User already in personal trainer');
    }

    await this.personalTrainerEntity.findByIdAndUpdate(personalTrainer._id, {
      $push: { users: user._id },
    });

    await this.userEntity.findByIdAndUpdate(user._id, {
      personalTrainer: personalTrainer._id,
    });

    return {
      message: 'User added to personal trainer',
    };
  }
}
