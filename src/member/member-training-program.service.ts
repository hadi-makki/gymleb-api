import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MemberTrainingProgramEntity } from './entities/member-training-program.entity';
import { MemberEntity } from './entities/member.entity';
import { ManagerEntity } from 'src/manager/manager.entity';
import { CreateTrainingProgramDto } from './dto/create-training-program.dto';
import { UpdateTrainingProgramDto } from './dto/update-training-program.dto';
import { DayOfWeek } from './entities/member-attending-days.entity';

@Injectable()
export class MemberTrainingProgramService {
  constructor(
    @InjectRepository(MemberTrainingProgramEntity)
    private readonly trainingProgramRepository: Repository<MemberTrainingProgramEntity>,
    @InjectRepository(MemberEntity)
    private readonly memberRepository: Repository<MemberEntity>,
  ) {}

  async createOrUpdateTrainingProgram(
    memberId: string,
    gymId: string,
    createTrainingProgramDto: CreateTrainingProgramDto,
    manager: ManagerEntity,
  ) {
    // Verify member exists and belongs to the gym
    const member = await this.memberRepository.findOne({
      where: { id: memberId, gym: { id: gymId } },
      relations: ['gym'],
    });

    if (!member) {
      throw new NotFoundException('Member not found');
    }

    // Check if training program already exists for this day
    const existingProgram = await this.trainingProgramRepository.findOne({
      where: {
        member: { id: memberId },
        dayOfWeek: createTrainingProgramDto.dayOfWeek,
      },
    });

    if (existingProgram) {
      // Update existing program
      existingProgram.name = createTrainingProgramDto.name;
      existingProgram.exercises = createTrainingProgramDto.exercises;
      return await this.trainingProgramRepository.save(existingProgram);
    } else {
      // Create new program
      const newProgram = this.trainingProgramRepository.create({
        member: { id: memberId },
        dayOfWeek: createTrainingProgramDto.dayOfWeek,
        name: createTrainingProgramDto.name,
        exercises: createTrainingProgramDto.exercises,
      });
      return await this.trainingProgramRepository.save(newProgram);
    }
  }

  async getMemberTrainingPrograms(
    memberId: string,
    gymId: string,
    manager: ManagerEntity | null,
  ) {
    // Verify member exists and belongs to the gym
    const member = await this.memberRepository.findOne({
      where: { id: memberId, gym: { id: gymId } },
    });

    if (!member) {
      throw new NotFoundException('Member not found');
    }

    const trainingPrograms = await this.trainingProgramRepository.find({
      where: { member: { id: memberId } },
      order: {
        dayOfWeek: 'ASC',
      },
    });

    // Create a map for all days of the week
    const allDays = Object.values(DayOfWeek);
    const programsMap = new Map();

    trainingPrograms.forEach((program) => {
      programsMap.set(program.dayOfWeek, program);
    });

    // Return programs organized by day
    const result = allDays.map((day) => ({
      dayOfWeek: day,
      program: programsMap.get(day) || null,
    }));

    return result;
  }

  async getTrainingProgramByDay(
    memberId: string,
    gymId: string,
    dayOfWeek: string,
    manager: ManagerEntity | null,
  ) {
    // Verify member exists and belongs to the gym
    const member = await this.memberRepository.findOne({
      where: { id: memberId, gym: { id: gymId } },
    });

    if (!member) {
      throw new NotFoundException('Member not found');
    }

    // Validate day of week
    if (!Object.values(DayOfWeek).includes(dayOfWeek as DayOfWeek)) {
      throw new NotFoundException('Invalid day of week');
    }

    const trainingProgram = await this.trainingProgramRepository.findOne({
      where: {
        member: { id: memberId },
        dayOfWeek: dayOfWeek as DayOfWeek,
      },
    });

    return trainingProgram;
  }

  async updateTrainingProgram(
    memberId: string,
    gymId: string,
    dayOfWeek: string,
    updateTrainingProgramDto: UpdateTrainingProgramDto,
    manager: ManagerEntity,
  ) {
    // Verify member exists and belongs to the gym
    const member = await this.memberRepository.findOne({
      where: { id: memberId, gym: { id: gymId } },
    });

    if (!member) {
      throw new NotFoundException('Member not found');
    }

    // Validate day of week
    if (!Object.values(DayOfWeek).includes(dayOfWeek as DayOfWeek)) {
      throw new NotFoundException('Invalid day of week');
    }

    const trainingProgram = await this.trainingProgramRepository.findOne({
      where: {
        member: { id: memberId },
        dayOfWeek: dayOfWeek as DayOfWeek,
      },
    });

    if (!trainingProgram) {
      throw new NotFoundException('Training program not found for this day');
    }

    trainingProgram.name = updateTrainingProgramDto.name;
    trainingProgram.exercises = updateTrainingProgramDto.exercises;

    return await this.trainingProgramRepository.save(trainingProgram);
  }

  async deleteTrainingProgram(
    memberId: string,
    gymId: string,
    dayOfWeek: string,
    manager: ManagerEntity,
  ) {
    // Verify member exists and belongs to the gym
    const member = await this.memberRepository.findOne({
      where: { id: memberId, gym: { id: gymId } },
    });

    if (!member) {
      throw new NotFoundException('Member not found');
    }

    // Validate day of week
    if (!Object.values(DayOfWeek).includes(dayOfWeek as DayOfWeek)) {
      throw new NotFoundException('Invalid day of week');
    }

    const trainingProgram = await this.trainingProgramRepository.findOne({
      where: {
        member: { id: memberId },
        dayOfWeek: dayOfWeek as DayOfWeek,
      },
    });

    if (!trainingProgram) {
      throw new NotFoundException('Training program not found for this day');
    }

    await this.trainingProgramRepository.remove(trainingProgram);
    return { message: 'Training program deleted successfully' };
  }
}
