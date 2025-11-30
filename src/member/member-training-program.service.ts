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
import { GymEntity } from 'src/gym/entities/gym.entity';
import { CreateTrainingProgramDto } from './dto/create-training-program.dto';
import { UpdateTrainingProgramDto } from './dto/update-training-program.dto';
import {
  MemberWithTrainingProgramsDto,
  UserTrainingProgramsResponseDto,
} from './dto/return-user-training-programs.dto';
import { isUUID } from 'class-validator';

@Injectable()
export class MemberTrainingProgramService {
  constructor(
    @InjectRepository(MemberTrainingProgramEntity)
    private readonly trainingProgramRepository: Repository<MemberTrainingProgramEntity>,
    @InjectRepository(MemberEntity)
    private readonly memberRepository: Repository<MemberEntity>,
    @InjectRepository(GymEntity)
    private readonly gymRepository: Repository<GymEntity>,
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
        programKey: programKey,
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
        programKey: programKey,
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
        programKey: programKey,
      },
    });

    if (!trainingProgram) {
      throw new NotFoundException('Training program not found for this key');
    }

    await this.trainingProgramRepository.remove(trainingProgram);
    return { message: 'Training program deleted successfully' };
  }

  async renameTrainingProgramKey(
    memberId: string,
    gymId: string,
    programKey: string,
    newProgramKey: string,
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
      where: { member: { id: memberId }, programKey: programKey },
    });

    if (!trainingProgram) {
      throw new NotFoundException('Training program not found for this key');
    }

    // If there is already a program with the new key, overwrite it by moving data
    const existingTarget = await this.trainingProgramRepository.findOne({
      where: { member: { id: memberId }, programKey: newProgramKey },
    });

    if (existingTarget) {
      // Overwrite name/exercises of target, then delete old one
      existingTarget.name = trainingProgram.name;
      existingTarget.exercises = trainingProgram.exercises;
      await this.trainingProgramRepository.save(existingTarget);
      await this.trainingProgramRepository.remove(trainingProgram);
      return existingTarget;
    }

    trainingProgram.programKey = newProgramKey;
    return await this.trainingProgramRepository.save(trainingProgram);
  }

  async renameTrainingProgramKeyById(
    memberId: string,
    gymId: string,
    programId: string,
    newProgramKey: string,
    manager: ManagerEntity | null,
  ) {
    // Verify member belongs to gym
    const member = await this.memberRepository.findOne({
      where: {
        id: memberId,
        ...(isUUID(gymId)
          ? { gym: { id: gymId } }
          : { gym: { gymDashedName: gymId } }),
      },
    });
    if (!member) throw new NotFoundException('Member not found');

    const trainingProgram = await this.trainingProgramRepository.findOne({
      where: { id: programId, member: { id: memberId } },
    });
    if (!trainingProgram) {
      throw new NotFoundException('Training program not found');
    }

    const existingTarget = await this.trainingProgramRepository.findOne({
      where: { member: { id: memberId }, programKey: newProgramKey },
    });
    if (existingTarget) {
      existingTarget.name = trainingProgram.name;
      existingTarget.exercises = trainingProgram.exercises;
      await this.trainingProgramRepository.save(existingTarget);
      await this.trainingProgramRepository.remove(trainingProgram);
      return existingTarget;
    }

    trainingProgram.programKey = newProgramKey;
    return await this.trainingProgramRepository.save(trainingProgram);
  }

  // User endpoints methods
  async getUserMembersWithTrainingPrograms(
    userId: string,
    gymId: string,
  ): Promise<UserTrainingProgramsResponseDto> {
    // Get gym first to check permissions
    const gym = await this.gymRepository.findOne({
      where: isUUID(gymId) ? { id: gymId } : { gymDashedName: gymId },
    });

    if (!gym) {
      throw new NotFoundException('Gym not found');
    }

    // Get all members for this user in this gym
    const members = await this.memberRepository.find({
      where: {
        user: { id: userId },
        ...(isUUID(gymId)
          ? { gym: { id: gymId } }
          : { gym: { gymDashedName: gymId } }),
      },
      relations: ['gym'],
    });

    // Get training programs for each member
    const membersWithPrograms: MemberWithTrainingProgramsDto[] =
      await Promise.all(
        members.map(async (member) => {
          const trainingPrograms = await this.trainingProgramRepository.find({
            where: { member: { id: member.id } },
            order: {
              programKey: 'ASC',
            },
          });

          return {
            id: member.id,
            name: member.name,
            email: member.email,
            phone: member.phone,
            trainingPrograms,
          };
        }),
      );

    return {
      members: membersWithPrograms,
      gymId: gym.id,
      gymName: gym.name,
      allowMemberEditTrainingProgram: gym.allowMemberEditTrainingProgram,
    };
  }

  async getUserMemberTrainingPrograms(
    userId: string,
    gymId: string,
    memberId: string,
  ) {
    // Verify user owns the member and member belongs to gym
    const member = await this.memberRepository.findOne({
      where: {
        id: memberId,
        user: { id: userId },
        ...(isUUID(gymId)
          ? { gym: { id: gymId } }
          : { gym: { gymDashedName: gymId } }),
      },
    });

    if (!member) {
      throw new ForbiddenException(
        'Member not found or you do not have access to this member',
      );
    }

    const trainingPrograms = await this.trainingProgramRepository.find({
      where: { member: { id: memberId } },
      order: {
        programKey: 'ASC',
      },
    });

    return trainingPrograms;
  }

  async createOrUpdateUserMemberTrainingProgram(
    userId: string,
    gymId: string,
    memberId: string,
    createTrainingProgramDto: CreateTrainingProgramDto,
  ) {
    // Verify user owns the member and member belongs to gym
    const member = await this.memberRepository.findOne({
      where: {
        id: memberId,
        user: { id: userId },
        ...(isUUID(gymId)
          ? { gym: { id: gymId } }
          : { gym: { gymDashedName: gymId } }),
      },
      relations: ['gym'],
    });

    if (!member) {
      throw new ForbiddenException(
        'Member not found or you do not have access to this member',
      );
    }

    // Check if gym allows editing
    if (!member.gym.allowMemberEditTrainingProgram) {
      throw new ForbiddenException(
        'This gym does not allow editing training programs',
      );
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

  async updateUserMemberTrainingProgram(
    userId: string,
    gymId: string,
    memberId: string,
    programKey: string,
    updateTrainingProgramDto: UpdateTrainingProgramDto,
  ) {
    // Verify user owns the member and member belongs to gym
    const member = await this.memberRepository.findOne({
      where: {
        id: memberId,
        user: { id: userId },
        ...(isUUID(gymId)
          ? { gym: { id: gymId } }
          : { gym: { gymDashedName: gymId } }),
      },
      relations: ['gym'],
    });

    if (!member) {
      throw new ForbiddenException(
        'Member not found or you do not have access to this member',
      );
    }

    // Check if gym allows editing
    if (!member.gym.allowMemberEditTrainingProgram) {
      throw new ForbiddenException(
        'This gym does not allow editing training programs',
      );
    }

    const trainingProgram = await this.trainingProgramRepository.findOne({
      where: {
        member: { id: memberId },
        programKey: programKey,
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

  async deleteUserMemberTrainingProgram(
    userId: string,
    gymId: string,
    memberId: string,
    programKey: string,
  ) {
    // Verify user owns the member and member belongs to gym
    const member = await this.memberRepository.findOne({
      where: {
        id: memberId,
        user: { id: userId },
        ...(isUUID(gymId)
          ? { gym: { id: gymId } }
          : { gym: { gymDashedName: gymId } }),
      },
      relations: ['gym'],
    });

    if (!member) {
      throw new ForbiddenException(
        'Member not found or you do not have access to this member',
      );
    }

    // Check if gym allows editing
    if (!member.gym.allowMemberEditTrainingProgram) {
      throw new ForbiddenException(
        'This gym does not allow editing training programs',
      );
    }

    const trainingProgram = await this.trainingProgramRepository.findOne({
      where: {
        member: { id: memberId },
        programKey: programKey,
      },
    });

    if (!trainingProgram) {
      throw new NotFoundException('Training program not found for this key');
    }

    await this.trainingProgramRepository.remove(trainingProgram);
    return { message: 'Training program deleted successfully' };
  }

  async renameUserMemberTrainingProgramKey(
    userId: string,
    gymId: string,
    memberId: string,
    programId: string,
    newProgramKey: string,
  ) {
    // Verify user owns the member and member belongs to gym
    const member = await this.memberRepository.findOne({
      where: {
        id: memberId,
        user: { id: userId },
        ...(isUUID(gymId)
          ? { gym: { id: gymId } }
          : { gym: { gymDashedName: gymId } }),
      },
      relations: ['gym'],
    });

    if (!member) {
      throw new ForbiddenException(
        'Member not found or you do not have access to this member',
      );
    }

    // Check if gym allows editing
    if (!member.gym.allowMemberEditTrainingProgram) {
      throw new ForbiddenException(
        'This gym does not allow editing training programs',
      );
    }

    const trainingProgram = await this.trainingProgramRepository.findOne({
      where: { id: programId, member: { id: memberId } },
    });

    if (!trainingProgram) {
      throw new NotFoundException('Training program not found');
    }

    const existingTarget = await this.trainingProgramRepository.findOne({
      where: { member: { id: memberId }, programKey: newProgramKey },
    });

    if (existingTarget) {
      existingTarget.name = trainingProgram.name;
      existingTarget.exercises = trainingProgram.exercises;
      await this.trainingProgramRepository.save(existingTarget);
      await this.trainingProgramRepository.remove(trainingProgram);
      return existingTarget;
    }

    trainingProgram.programKey = newProgramKey;
    return await this.trainingProgramRepository.save(trainingProgram);
  }
}
