import { Injectable } from '@nestjs/common';
import { CreateGymOwnerDto } from './dto/create-gym-owner.dto';
import { UpdateGymOwnerDto } from './dto/update-gym-owner.dto';

@Injectable()
export class GymOwnerService {
  create(createGymOwnerDto: CreateGymOwnerDto) {
    return 'This action adds a new gymOwner';
  }

  findAll() {
    return `This action returns all gymOwner`;
  }

  findOne(id: number) {
    return `This action returns a #${id} gymOwner`;
  }

  update(id: number, updateGymOwnerDto: UpdateGymOwnerDto) {
    return `This action updates a #${id} gymOwner`;
  }

  remove(id: number) {
    return `This action removes a #${id} gymOwner`;
  }
}
