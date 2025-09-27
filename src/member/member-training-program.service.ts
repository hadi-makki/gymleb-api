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
import { ProgramKey } from './entities/member-training-program.entity';
import { isUUID } from 'class-validator';

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
      where: {
        id: memberId,
        ...(isUUID(gymId)
          ? { gym: { id: gymId } }
          : { gym: { gymDashedName: gymId } }),
      },
      relations: ['gym'],
    });

    if (!member) {
      throw new NotFoundException('Member not found');
    }

    // Check if training program already exists for this key
    const existingProgram = await this.trainingProgramRepository.findOne({
      where: {
        member: { id: memberId },
        programKey: createTrainingProgramDto.programKey,
      },
    });

    if (existingProgram) {
      // Update existing program
      existingProgram.name = createTrainingProgramDto.name;
      existingProgram.exercises = createTrainingProgramDto.exercises.map(
        (exercise) => ({
          name: exercise.name,
          sets: exercise.sets.map((set) => ({
            reps: set.reps,
            weight: set.weight,
          })),
        }),
      );
      return await this.trainingProgramRepository.save(existingProgram);
    } else {
      // Create new program
      const newProgram = this.trainingProgramRepository.create({
        member: { id: memberId },
        programKey: createTrainingProgramDto.programKey,
        name: createTrainingProgramDto.name,
        exercises: createTrainingProgramDto.exercises.map((exercise) => ({
          name: exercise.name,
          sets: exercise.sets.map((set) => ({
            reps: set.reps,
            weight: set.weight,
          })),
        })),
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
      where: {
        id: memberId,
        ...(isUUID(gymId)
          ? { gym: { id: gymId } }
          : { gym: { gymDashedName: gymId } }),
      },
    });

    if (!member) {
      throw new NotFoundException('Member not found');
    }

    const trainingPrograms = await this.trainingProgramRepository.find({
      where: { member: { id: memberId } },
      order: {
        programKey: 'ASC',
      },
    });

    // Return flat list of named programs
    return trainingPrograms;
  }

  async getTrainingProgramByKey(
    memberId: string,
    gymId: string,
    programKey: string,
    manager: ManagerEntity | null,
  ) {
    // Verify member exists and belongs to the gym
    const member = await this.memberRepository.findOne({
      where: {
        id: memberId,
        ...(isUUID(gymId)
          ? { gym: { id: gymId } }
          : { gym: { gymDashedName: gymId } }),
      },
    });

    if (!member) {
      throw new NotFoundException('Member not found');
    }

    const trainingProgram = await this.trainingProgramRepository.findOne({
      where: {
        member: { id: memberId },
        programKey: programKey as ProgramKey,
      },
    });

    return trainingProgram;
  }

  async updateTrainingProgram(
    memberId: string,
    gymId: string,
    programKey: string,
    updateTrainingProgramDto: UpdateTrainingProgramDto,
    manager: ManagerEntity,
  ) {
    // Verify member exists and belongs to the gym
    const member = await this.memberRepository.findOne({
      where: {
        id: memberId,
        ...(isUUID(gymId)
          ? { gym: { id: gymId } }
          : { gym: { gymDashedName: gymId } }),
      },
    });

    if (!member) {
      throw new NotFoundException('Member not found');
    }

    const trainingProgram = await this.trainingProgramRepository.findOne({
      where: {
        member: { id: memberId },
        programKey: programKey as ProgramKey,
      },
    });

    if (!trainingProgram) {
      throw new NotFoundException('Training program not found for this key');
    }

    trainingProgram.name = updateTrainingProgramDto.name;
    trainingProgram.exercises = updateTrainingProgramDto.exercises.map(
      (exercise) => ({
        name: exercise.name,
        sets: exercise.sets.map((set) => ({
          reps: set.reps,
          weight: set.weight,
        })),
      }),
    );

    return await this.trainingProgramRepository.save(trainingProgram);
  }

  async deleteTrainingProgram(
    memberId: string,
    gymId: string,
    programKey: string,
    manager: ManagerEntity,
  ) {
    // Verify member exists and belongs to the gym
    const member = await this.memberRepository.findOne({
      where: {
        id: memberId,
        ...(isUUID(gymId)
          ? { gym: { id: gymId } }
          : { gym: { gymDashedName: gymId } }),
      },
    });

    if (!member) {
      throw new NotFoundException('Member not found');
    }

    const trainingProgram = await this.trainingProgramRepository.findOne({
      where: {
        member: { id: memberId },
        programKey: programKey as ProgramKey,
      },
    });

    if (!trainingProgram) {
      throw new NotFoundException('Training program not found for this key');
    }

    await this.trainingProgramRepository.remove(trainingProgram);
    return { message: 'Training program deleted successfully' };
  }
}
