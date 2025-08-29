import { BadRequestException, Injectable } from '@nestjs/common';
import { CreatePersonalTrainerDto } from './dto/create-personal-trainer.dto';
import { UpdatePersonalTrainerDto } from './dto/update-personal-trainer.dto';
import { Model, Types } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Permissions } from '../decorators/roles/role.enum';
import { User } from '../user/user.model';
import { AddPersonalTrainerDto } from './dto/add-personal-trainer.dto';
import { NotFoundException } from '../error/not-found-error';
import { CreateSessionDto } from './dto/create-session.dto';
import { UpdateSessionDto } from './dto/update-session.dto';
import { PTSession } from './entities/pt-sessions.model';
import { Gym } from 'src/gym/entities/gym.model';
import { Member } from 'src/member/entities/member.model';
import { ManagerService } from 'src/manager/manager.service';
import { v4 as uuidv4 } from 'uuid';
import { TransactionType } from 'src/transactions/transaction.model';
import { TransactionService } from 'src/transactions/subscription-instance.service';
import { InjectRepository } from '@nestjs/typeorm';
import { ManagerEntity } from 'src/manager/manager.entity';
import { UserEntity } from 'src/user/user.entity';
import { ILike, In, Raw, Repository } from 'typeorm';
import { GymEntity } from 'src/gym/entities/gym.entity';
import { PTSessionEntity } from './entities/pt-sessions.entity';
import { MemberEntity } from 'src/member/entities/member.entity';

@Injectable()
export class PersonalTrainersService {
  constructor(
    @InjectRepository(ManagerEntity)
    private readonly personalTrainerEntity: Repository<ManagerEntity>,
    @InjectRepository(PTSessionEntity)
    private readonly sessionEntity: Repository<PTSessionEntity>,
    @InjectRepository(GymEntity)
    private readonly gymEntity: Repository<GymEntity>,
    @InjectRepository(MemberEntity)
    private readonly memberEntity: Repository<MemberEntity>,
    @InjectRepository(ManagerEntity)
    private readonly managerEntity: Repository<ManagerEntity>,
    private readonly managerService: ManagerService,
    private readonly transactionService: TransactionService,
  ) {}

  async removeClientFromTrainer(memberId: string, gymId: string) {
    const member = await this.memberEntity.findOne({ where: { id: memberId } });
    console.log(
      'this is the member inside the removeClientFromTrainer',
      member,
    );
    if (!member) {
      console.log('we did not find the member');
      throw new NotFoundException('Member not found');
    }

    const trainer = await this.managerEntity.findOne({
      where: { members: { id: member.id } },
    });
    if (!trainer) {
      throw new NotFoundException('Trainer not found');
    }

    await this.sessionEntity.delete({
      member: member,
      personalTrainer: trainer,
    });

    return {
      message: 'Client removed from trainer',
    };
  }

  async create(
    createPersonalTrainerDto: CreatePersonalTrainerDto,
    gymId: string,
  ) {
    const gym = await this.gymEntity.findOne({ where: { id: gymId } });
    if (!gym) {
      throw new NotFoundException('Gym not found');
    }

    const checkIfPersonalTrainerExists =
      (await this.personalTrainerEntity.findOne({
        where: { phoneNumber: createPersonalTrainerDto.phone },
      })) ||
      (await this.managerEntity.findOne({
        where: { phoneNumber: createPersonalTrainerDto.phone },
      }));

    if (checkIfPersonalTrainerExists) {
      throw new BadRequestException('Personal trainer already exists');
    }

    const personalTrainer = await this.managerService.createPersonalTrainer(
      {
        username:
          createPersonalTrainerDto.firstName +
          createPersonalTrainerDto.lastName +
          Math.random().toString(36).substring(2, 15),
        password: createPersonalTrainerDto.password,
        phoneNumber: createPersonalTrainerDto.phone,
        roles: [Permissions.personalTrainers],
        email: createPersonalTrainerDto.email,
      },
      uuidv4(),
      gymId,
      createPersonalTrainerDto.firstName,
      createPersonalTrainerDto.lastName,
    );
    return personalTrainer;
  }

  findAll() {
    return this.personalTrainerEntity.find();
  }

  findOne(id: string) {
    return this.personalTrainerEntity.findOne({ where: { id } });
  }

  update(id: string, updatePersonalTrainerDto: UpdatePersonalTrainerDto) {
    return this.personalTrainerEntity.update(id, updatePersonalTrainerDto);
  }

  remove(id: string) {
    return this.personalTrainerEntity.delete(id);
  }

  findAllUsers(personalTrainer: ManagerEntity) {
    return this.memberEntity.find({
      where: { personalTrainer: personalTrainer },
    });
  }

  async addUserToPersonalTrainer(
    addPersonalTrainerDto: AddPersonalTrainerDto,
    personalTrainer: ManagerEntity,
  ) {
    const user = await this.memberEntity.findOne({
      where: { id: addPersonalTrainerDto.userId },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const checkIfUserIsAlreadyInPersonalTrainer =
      await this.personalTrainerEntity.findOne({
        where: { members: { id: user.id } },
        relations: ['members'],
      });

    if (checkIfUserIsAlreadyInPersonalTrainer) {
      throw new BadRequestException('User already in personal trainer');
    }

    user.personalTrainer = personalTrainer;
    await this.memberEntity.save(user);

    return {
      message: 'User added to personal trainer',
    };
  }

  async createSession(gymId: string, createSessionDto: CreateSessionDto) {
    const gym = await this.gymEntity.findOne({ where: { id: gymId } });
    if (!gym) {
      throw new NotFoundException('Gym not found');
    }

    const checkIfUserInGym = await this.memberEntity.findOne({
      where: { id: createSessionDto.memberId },
      relations: ['gym'],
    });

    if (!checkIfUserInGym || checkIfUserInGym.gym.id !== gymId) {
      throw new NotFoundException('Member not found in gym');
    }

    const checkIfPersonalTrainerInGym =
      await this.personalTrainerEntity.findOne({
        where: { id: createSessionDto.personalTrainerId },
        relations: ['gyms'],
      });

    if (
      !checkIfPersonalTrainerInGym ||
      !checkIfPersonalTrainerInGym.gyms.some((gym) => gym.id === gymId)
    ) {
      throw new NotFoundException('Personal trainer not found in gym');
    }

    let setDateDone = false;

    for (let i = 0; i < createSessionDto.numberOfSessions; i++) {
      const createSessionModel = this.sessionEntity.create({
        member: checkIfUserInGym,
        personalTrainer: checkIfPersonalTrainerInGym,
        gym: gym,
        sessionPrice: createSessionDto.sessionPrice,
        sessionDate: !setDateDone ? new Date(createSessionDto.date) : null,
      });
      const session = await this.sessionEntity.save(createSessionModel);
      checkIfUserInGym.ptSessions.push(session);
      await this.memberEntity.save(checkIfUserInGym);

      await this.transactionService.createPersonalTrainerSessionTransaction({
        personalTrainer: checkIfPersonalTrainerInGym,
        gym: gym,
        member: checkIfUserInGym,
        amount: createSessionDto.sessionPrice,
      });

      setDateDone = true;
    }

    return {
      message: 'Sessions created successfully',
    };
  }

  async findAllSessions(gymId: string, personalTrainer: ManagerEntity) {
    const checkGym = await this.gymEntity.findOne({ where: { id: gymId } });
    if (!checkGym) {
      throw new NotFoundException('Gym not found');
    }

    // Check if the user is a personal trainer (not gym owner or super admin)
    const isPersonalTrainer =
      personalTrainer.permissions.includes(Permissions.personalTrainers) &&
      !personalTrainer.permissions.includes(Permissions.GymOwner) &&
      !personalTrainer.permissions.includes(Permissions.SuperAdmin);

    return await this.sessionEntity.find({
      where: {
        gym: { id: gymId },
        ...(isPersonalTrainer ? { personalTrainer: personalTrainer } : {}),
      },
      relations: ['member', 'personalTrainer', 'gym'],
      order: { sessionDate: 'ASC' },
    });
  }

  async findByGym(gymId: string) {
    const gym = await this.gymEntity.findOne({ where: { id: gymId } });
    if (!gym) {
      throw new NotFoundException('Gym not found');
    }

    const personalTrainers = await this.personalTrainerEntity.find({
      where: {
        gyms: { id: gymId },
        permissions: Raw(
          (alias) => `${alias} @> '["${Permissions.personalTrainers}"]'::jsonb`,
        ),
      },
      relations: ['gyms'],
    });

    const sessionsResult: {
      personalTrainer: ManagerEntity;
      clientsCount: number;
    }[] = [];

    for (const personalTrainer of personalTrainers) {
      const sessions = await this.sessionEntity.find({
        where: {
          personalTrainer: { id: personalTrainer.id },
          gym: { id: gym.id },
        },
        relations: ['member'],
      });
      const clients = sessions.map((session) => session.member?.id);
      // filter out duplicates
      const uniqueClients = [...new Set(clients)];
      sessionsResult.push({
        personalTrainer,
        clientsCount: uniqueClients.length,
      });
    }

    return sessionsResult;
  }

  async getGymMembers(gymId: string, search?: string, limit?: number) {
    const gym = await this.gymEntity.findOne({
      where: { id: gymId },
    });
    if (!gym) {
      throw new NotFoundException('Gym not found');
    }

    // Build the query using TypeORM syntax
    let whereCondition: any = { gym: gym };

    // Add search functionality using TypeORM's ILike
    if (search) {
      whereCondition = [
        { gym: gym, name: ILike(`%${search}%`) },
        { gym: gym, phone: ILike(`%${search}%`) },
        { gym: gym, email: ILike(`%${search}%`) },
      ];
    }

    const queryOptions: any = {
      where: whereCondition,
      relations: ['gym', 'subscription', 'transactions'],
      order: { createdAt: 'DESC' },
    };

    // Add limit if provided
    if (limit) {
      queryOptions.take = limit;
    }

    return await this.memberEntity.find(queryOptions);
  }

  async cancelSession(sessionId: string, reason: string) {
    const session = await this.sessionEntity.findOne({
      where: { id: sessionId },
    });
    if (!session) {
      throw new NotFoundException('Session not found');
    }

    await this.sessionEntity.update(sessionId, {
      isCancelled: true,
      cancelledReason: reason,
      cancelledAt: new Date(),
    });

    return {
      message: 'Session cancelled successfully',
    };
  }

  async updateSession(sessionId: string, updateSessionDto: UpdateSessionDto) {
    const session = await this.sessionEntity.findOne({
      where: { id: sessionId },
    });
    if (!session) {
      throw new NotFoundException('Session not found');
    }

    const updateData: any = {};

    // Update member if provided
    if (updateSessionDto.memberId) {
      const member = await this.memberEntity.findOne({
        where: { id: updateSessionDto.memberId },
      });
      if (!member) {
        throw new NotFoundException('Member not found');
      }
      updateData.member = member;
    }

    // Update session date if provided
    if (updateSessionDto.date) {
      updateData.sessionDate = new Date(updateSessionDto.date);
    }

    // Update session price if provided
    if (updateSessionDto.sessionPrice !== undefined) {
      updateData.sessionPrice = updateSessionDto.sessionPrice;
    }

    await this.sessionEntity.update(sessionId, updateData);

    return {
      message: 'Session updated successfully',
    };
  }

  async getTrainerSessions(trainerId: string, gymId: string) {
    const gym = await this.gymEntity.findOne({ where: { id: gymId } });
    if (!gym) {
      throw new NotFoundException('Gym not found');
    }

    const trainer = await this.managerEntity.findOne({
      where: { id: trainerId },
    });
    if (!trainer) {
      throw new NotFoundException('Personal trainer not found');
    }

    const sessions = await this.sessionEntity.find({
      where: {
        gym: gym,
        personalTrainer: trainer,
      },
      relations: ['member', 'personalTrainer', 'gym'],
    });

    // Sort sessions: sessions with dates first (by date), then sessions without dates
    return sessions.sort((a, b) => {
      // If both have dates, sort by date
      if (a.sessionDate && b.sessionDate) {
        return (
          new Date(a.sessionDate).getTime() - new Date(b.sessionDate).getTime()
        );
      }
      // If only a has date, a comes first
      if (a.sessionDate && !b.sessionDate) {
        return -1;
      }
      // If only b has date, b comes first
      if (!a.sessionDate && b.sessionDate) {
        return 1;
      }
      // If neither has date, maintain original order
      return 0;
    });
  }

  async getTrainerClients(trainerId: string, gymId: string) {
    const gym = await this.gymEntity.findOne({ where: { id: gymId } });
    if (!gym) {
      throw new NotFoundException('Gym not found');
    }

    const trainer = await this.managerEntity.findOne({
      where: { id: trainerId },
    });
    if (!trainer) {
      throw new NotFoundException('Personal trainer not found');
    }

    // Get all sessions for this trainer
    const sessions = await this.sessionEntity.find({
      where: {
        gym: gym,
        personalTrainer: trainer,
      },
      relations: ['member'],
    });

    // Get unique members and their session counts
    const memberMap = new Map();

    sessions.forEach((session) => {
      const memberId = session.member?.id;
      if (!memberMap.has(memberId)) {
        memberMap.set(memberId, {
          member: session.member,
          totalSessions: 0,
          upcomingSessions: 0,
          completedSessions: 0,
          cancelledSessions: 0,
          totalRevenue: 0,
          unscheduledSessions: 0,
        });
      }

      const clientData = memberMap.get(memberId);
      clientData.totalSessions++;

      if (session.isCancelled) {
        clientData.cancelledSessions++;
      } else if (
        session.sessionDate &&
        new Date(session.sessionDate) > new Date()
      ) {
        clientData.upcomingSessions++;
      } else if (!session.sessionDate) {
        // sessions not scheduled yet
        clientData.unscheduledSessions++;
      } else {
        clientData.completedSessions++;
      }

      if (session.sessionPrice) {
        clientData.totalRevenue += session.sessionPrice;
      }
    });

    return Array.from(memberMap.values());
  }

  async getTrainerClientSessions(
    trainerId: string,
    memberId: string,
    gymId: string,
  ) {
    const gym = await this.gymEntity.findOne({ where: { id: gymId } });
    if (!gym) {
      throw new NotFoundException('Gym not found');
    }

    const trainer = await this.managerEntity.findOne({
      where: { id: trainerId },
    });
    if (!trainer) {
      throw new NotFoundException('Personal trainer not found');
    }

    const member = await this.memberEntity.findOne({ where: { id: memberId } });
    if (!member) {
      throw new NotFoundException('Member not found');
    }

    const sessions = await this.sessionEntity.find({
      where: {
        gym: gym,
        personalTrainer: trainer,
        member: member,
      },
      relations: ['member', 'personalTrainer', 'gym'],
    });

    // Sort sessions: sessions with dates first (by date), then sessions without dates
    return sessions.sort((a, b) => {
      // If both have dates, sort by date
      if (a.sessionDate && b.sessionDate) {
        return (
          new Date(a.sessionDate).getTime() - new Date(b.sessionDate).getTime()
        );
      }
      // If only a has date, a comes first
      if (a.sessionDate && !b.sessionDate) {
        return -1;
      }
      // If only b has date, b comes first
      if (!a.sessionDate && b.sessionDate) {
        return 1;
      }
      // If neither has date, maintain original order
      return 0;
    });
  }

  async mySessions(gymId: string, personalTrainer: ManagerEntity) {
    const gym = await this.gymEntity.findOne({ where: { id: gymId } });
    if (!gym) {
      throw new NotFoundException('Gym not found');
    }

    const sessions = await this.sessionEntity.find({
      where: {
        gym: gym,
        personalTrainer: personalTrainer,
      },

      relations: ['member', 'personalTrainer', 'gym'],
    });

    // Sort sessions: sessions with dates first (by date), then sessions without dates
    return sessions.sort((a, b) => {
      // If both have dates, sort by date
      if (a.sessionDate && b.sessionDate) {
        return (
          new Date(a.sessionDate).getTime() - new Date(b.sessionDate).getTime()
        );
      }
      // If only a has date, a comes first
      if (a.sessionDate && !b.sessionDate) {
        return -1;
      }
      // If only b has date, b comes first
      if (!a.sessionDate && b.sessionDate) {
        return 1;
      }
      // If neither has date, maintain original order
      return 0;
    });
  }

  async myClients(gymId: string, personalTrainer: ManagerEntity) {
    const gym = await this.gymEntity.findOne({ where: { id: gymId } });
    if (!gym) {
      throw new NotFoundException('Gym not found');
    }

    // Get all sessions for this trainer
    const sessions = await this.sessionEntity.find({
      where: {
        gym: gym,
        personalTrainer: personalTrainer,
      },
      relations: ['member', 'personalTrainer', 'gym'],
    });

    // Get unique members and their session counts
    const memberMap = new Map();

    sessions.forEach((session) => {
      const memberId = session.member?.id;
      if (!memberMap.has(memberId)) {
        memberMap.set(memberId, {
          member: session.member,
          totalSessions: 0,
          upcomingSessions: 0,
          completedSessions: 0,
          cancelledSessions: 0,
          totalRevenue: 0,
          unscheduledSessions: 0,
        });
      }

      const clientData = memberMap.get(memberId);
      clientData.totalSessions++;

      if (session.isCancelled) {
        clientData.cancelledSessions++;
      } else if (
        session.sessionDate &&
        new Date(session.sessionDate) > new Date()
      ) {
        clientData.upcomingSessions++;
      } else if (!session.sessionDate) {
        // sessions not scheduled yet
        clientData.unscheduledSessions++;
      } else {
        clientData.completedSessions++;
      }

      if (session.sessionPrice) {
        clientData.totalRevenue += session.sessionPrice;
      }
    });

    return Array.from(memberMap.values());
  }

  async getClientSessions(
    memberId: string,
    gymId: string,
    personalTrainer: ManagerEntity,
  ) {
    const gym = await this.gymEntity.findOne({ where: { id: gymId } });
    if (!gym) {
      throw new NotFoundException('Gym not found');
    }

    const member = await this.memberEntity.findOne({ where: { id: memberId } });
    if (!member) {
      throw new NotFoundException('Member not found');
    }

    const sessions = await this.sessionEntity.find({
      where: {
        gym: gym,
        personalTrainer: personalTrainer,
        member: member,
      },
      relations: ['member', 'personalTrainer', 'gym'],
    });

    // Sort sessions: sessions with dates first (by date), then sessions without dates
    return sessions.sort((a, b) => {
      // If both have dates, sort by date
      if (a.sessionDate && b.sessionDate) {
        return (
          new Date(a.sessionDate).getTime() - new Date(b.sessionDate).getTime()
        );
      }
      // If only a has date, a comes first
      if (a.sessionDate && !b.sessionDate) {
        return -1;
      }
      // If only b has date, b comes first
      if (!a.sessionDate && b.sessionDate) {
        return 1;
      }
      // If neither has date, maintain original order
      return 0;
    });
  }
}
