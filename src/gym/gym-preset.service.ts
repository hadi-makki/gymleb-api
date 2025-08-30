import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GymPresetEntity } from './entities/gym-preset.entity';
import { CreateGymPresetDto, UpdateGymPresetDto } from './dto/gym-preset.dto';
import { BadRequestException } from '../error/bad-request-error';
import { NotFoundException } from '../error/not-found-error';
import { isUUID } from 'class-validator';
import { GymEntity } from './entities/gym.entity';

@Injectable()
export class GymPresetService {
  constructor(
    @InjectRepository(GymPresetEntity)
    private gymPresetRepository: Repository<GymPresetEntity>,
    @InjectRepository(GymEntity)
    private gymRepository: Repository<GymEntity>,
  ) {}

  async create(gymId: string, createGymPresetDto: CreateGymPresetDto) {
    if (!isUUID(gymId)) {
      throw new BadRequestException('Invalid gym id');
    }
    const gym = await this.gymRepository.findOne({ where: { id: gymId } });

    if (!gym) {
      throw new NotFoundException('Gym not found');
    }
    const preset = new GymPresetEntity();
    preset.gym = gym;
    preset.name = createGymPresetDto.name;
    preset.startTime = createGymPresetDto.startTime;
    preset.endTime = createGymPresetDto.endTime;
    preset.description = createGymPresetDto.description || null;

    return await this.gymPresetRepository.save(preset);
  }

  async findAll(gymId: string) {
    if (!isUUID(gymId)) {
      throw new BadRequestException('Invalid gym id');
    }

    return await this.gymPresetRepository.find({
      where: { gym: { id: gymId } },
      order: { createdAt: 'ASC' },
    });
  }

  async findOne(id: string, gymId: string) {
    if (!isUUID(id)) {
      throw new BadRequestException('Invalid preset id');
    }
    if (!isUUID(gymId)) {
      throw new BadRequestException('Invalid gym id');
    }

    const preset = await this.gymPresetRepository.findOne({
      where: { id, gym: { id: gymId } },
    });

    if (!preset) {
      throw new NotFoundException('Preset not found');
    }

    return preset;
  }

  async update(
    id: string,
    gymId: string,
    updateGymPresetDto: UpdateGymPresetDto,
  ) {
    if (!isUUID(id)) {
      throw new BadRequestException('Invalid preset id');
    }
    if (!isUUID(gymId)) {
      throw new BadRequestException('Invalid gym id');
    }

    const preset = await this.gymPresetRepository.findOne({
      where: { id, gym: { id: gymId } },
    });

    if (!preset) {
      throw new NotFoundException('Preset not found');
    }

    if (updateGymPresetDto.name !== undefined) {
      preset.name = updateGymPresetDto.name;
    }
    if (updateGymPresetDto.startTime !== undefined) {
      preset.startTime = updateGymPresetDto.startTime;
    }
    if (updateGymPresetDto.endTime !== undefined) {
      preset.endTime = updateGymPresetDto.endTime;
    }
    if (updateGymPresetDto.description !== undefined) {
      preset.description = updateGymPresetDto.description;
    }

    return await this.gymPresetRepository.save(preset);
  }

  async remove(id: string, gymId: string) {
    if (!isUUID(id)) {
      throw new BadRequestException('Invalid preset id');
    }
    if (!isUUID(gymId)) {
      throw new BadRequestException('Invalid gym id');
    }

    const preset = await this.gymPresetRepository.findOne({
      where: { id, gym: { id: gymId } },
    });

    if (!preset) {
      throw new NotFoundException('Preset not found');
    }

    await this.gymPresetRepository.remove(preset);

    return { message: 'Preset deleted successfully' };
  }
}
