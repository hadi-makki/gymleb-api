import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { GymEntity } from 'src/gym/entities/gym.entity';
import { ManagerEntity } from 'src/manager/manager.entity';
import { ManagerService } from 'src/manager/manager.service';
import { MediaService } from 'src/media/media.service';
import { MemberEntity } from 'src/member/entities/member.entity';
import { TransactionService } from 'src/transactions/subscription-instance.service';
import { ILike, In, Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { Permissions } from '../decorators/roles/role.enum';
import { NotFoundException } from '../error/not-found-error';
import { AddPersonalTrainerDto } from './dto/add-personal-trainer.dto';
import { CreatePersonalTrainerDto } from './dto/create-personal-trainer.dto';
import { CreateSessionDto } from './dto/create-session.dto';
import { UpdatePersonalTrainerDto } from './dto/update-personal-trainer.dto';
import { UpdateSessionDto } from './dto/update-session.dto';
import { PTSessionEntity } from './entities/pt-sessions.entity';

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
    private readonly mediaService: MediaService,
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
      return;
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
    profileImage?: Express.Multer.File,
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
          (Math.floor(Math.random() * 10).toString() +
            Math.floor(Math.random() * 10).toString()),
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

    // Handle profile image upload if provided
    if (profileImage) {
      const imageData = await this.mediaService.upload(
        profileImage,
        personalTrainer.id,
      );
      await this.personalTrainerEntity.update(personalTrainer.id, {
        profileImage: imageData.id as any,
      });
    }

    return personalTrainer;
  }

  findAll() {
    return this.personalTrainerEntity.find();
  }

  findOne(id: string) {
    return this.personalTrainerEntity.findOne({ where: { id } });
  }

  async update(
    id: string,
    updatePersonalTrainerDto: UpdatePersonalTrainerDto,
    profileImage?: Express.Multer.File,
  ) {
    const personalTrainer = await this.personalTrainerEntity.findOne({
      where: { id },
      relations: ['profileImage'],
    });
    if (!personalTrainer) {
      throw new NotFoundException('Personal trainer not found');
    }

    // Handle profile image upload if provided
    if (profileImage) {
      // Delete old profile image if exists
      if (personalTrainer.profileImage) {
        try {
          await this.mediaService.delete(personalTrainer.profileImage.id);
        } catch (error) {
          // Continue even if deletion fails
          console.warn('Failed to delete old profile image:', error);
        }
      }

      const imageData = await this.mediaService.upload(
        profileImage,
        personalTrainer.id,
      );
      personalTrainer.profileImage = imageData;
      personalTrainer.firstName = updatePersonalTrainerDto.firstName;
      personalTrainer.lastName = updatePersonalTrainerDto.lastName;
      personalTrainer.email = updatePersonalTrainerDto.email;
      personalTrainer.phoneNumber = updatePersonalTrainerDto.phone;
      if (updatePersonalTrainerDto.password) {
        personalTrainer.password = await ManagerEntity.hashPassword(
          updatePersonalTrainerDto.password,
        );
      }
      await this.personalTrainerEntity.save(personalTrainer);
    } else {
      personalTrainer.firstName = updatePersonalTrainerDto.firstName;
      personalTrainer.lastName = updatePersonalTrainerDto.lastName;
      personalTrainer.email = updatePersonalTrainerDto.email;
      personalTrainer.phoneNumber = updatePersonalTrainerDto.phone;
      if (updatePersonalTrainerDto.password) {
        personalTrainer.password = await ManagerEntity.hashPassword(
          updatePersonalTrainerDto.password,
        );
      }
      await this.personalTrainerEntity.save(personalTrainer);
    }

    return { message: 'Personal trainer updated successfully' };
  }

  remove(id: string) {
    return this.personalTrainerEntity.delete(id);
  }

  async toggleReadOnlyPersonalTrainer(id: string, isReadOnly: boolean) {
    const manager = await this.personalTrainerEntity.findOne({ where: { id } });
    if (!manager) {
      throw new NotFoundException('Personal trainer not found');
    }
    manager.isReadOnlyPersonalTrainer = isReadOnly;
    await this.personalTrainerEntity.save(manager);
    return { message: 'Personal trainer read-only status updated', manager };
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

    // Decode and normalize memberIds from the DTO
    // Supports arrays where elements can be single IDs or comma-separated lists
    const decodedMemberIds = Array.isArray(createSessionDto.memberIds)
      ? Array.from(
          new Set(
            createSessionDto.memberIds
              .flatMap((raw) => decodeURIComponent(raw).split(','))
              .map((s) => s.trim())
              .filter(Boolean),
          ),
        )
      : [];

    // Validate members exist in gym
    const members = await this.memberEntity.find({
      where: {
        id: In(decodedMemberIds),
      },
      relations: ['gym'],
    });

    if (
      !members.length ||
      members.length !== decodedMemberIds.length ||
      members.some((m) => m.gym.id !== gymId)
    ) {
      throw new NotFoundException('One or more members not found in gym');
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

    const createSessionModel = this.sessionEntity.create({
      members,
      personalTrainer: checkIfPersonalTrainerInGym,
      gym: gym,
      sessionPrice: createSessionDto.sessionPrice,
      sessionDate: !setDateDone ? new Date(createSessionDto.date) : null,
    });
    const createdSession = await this.sessionEntity.save(createSessionModel);
    for (let i = 0; i < createSessionDto.numberOfSessions; i++) {
      // Create a separate transaction per member for this session
      for (const member of members) {
        await this.transactionService.createPersonalTrainerSessionTransaction({
          personalTrainer: checkIfPersonalTrainerInGym,
          gym: gym,
          member,
          amount: createSessionDto.sessionPrice,
          willPayLater: createSessionDto.willPayLater || false,
          ptSession: createdSession,
          isTakingPtSessionsCut: createSessionDto.isTakingPtSessionsCut,
        });
      }

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

    // Use a simpler approach to find personal trainers
    const allManagers = await this.personalTrainerEntity.find({
      where: { gyms: { id: gymId } },
      relations: ['gyms', 'profileImage'],
      order: { createdAt: 'DESC' },
    });

    // Filter managers who have personal-trainers permission
    const personalTrainers = allManagers.filter(
      (manager) =>
        manager.permissions &&
        Array.isArray(manager.permissions) &&
        manager.permissions.includes(Permissions.personalTrainers),
    );

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
        relations: ['members'],
      });
      const clients = sessions.map((session) =>
        session.members?.map((member) => member.id),
      );
      // filter out duplicates
      const uniqueClients = [...new Set(clients.flat())];
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
    let whereCondition: any = { gym: { id: gymId } };

    // Add search functionality using TypeORM's ILike
    if (search) {
      whereCondition = [
        { gym: { id: gymId }, name: ILike(`%${search}%`) },
        { gym: { id: gymId }, phone: ILike(`%${search}%`) },
        { gym: { id: gymId }, email: ILike(`%${search}%`) },
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
      relations: ['members'],
    });
    if (!session) {
      throw new NotFoundException('Session not found');
    }

    const updateData: any = {};

    // Update members if provided (supports multi-members)
    if (updateSessionDto.memberIds && updateSessionDto.memberIds.length > 0) {
      const members = await this.memberEntity.find({
        where: updateSessionDto.memberIds.map((id) => ({ id })),
      });
      if (!members.length) {
        throw new NotFoundException('Members not found');
      }
      updateData.members = members;
    } else if (updateSessionDto.memberId) {
      // Backward compatibility for single member updates
      const member = await this.memberEntity.findOne({
        where: { id: updateSessionDto.memberId },
      });
      if (!member) {
        throw new NotFoundException('Member not found');
      }
      updateData.members = [member];
    }

    // Update session date if provided
    if (updateSessionDto.date) {
      updateData.sessionDate = new Date(updateSessionDto.date);
    }

    // Update session price if provided
    if (updateSessionDto.sessionPrice !== undefined) {
      updateData.sessionPrice = updateSessionDto.sessionPrice;
    }

    await this.sessionEntity.save({ ...session, ...updateData });

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
        gym: { id: gymId },
        personalTrainer: { id: trainerId },
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
        gym: { id: gymId },
        personalTrainer: { id: trainerId },
      },
      relations: ['members'],
    });

    // Group sessions by the exact set of participating members
    // Key format: sorted member IDs joined by '|'
    const groupMap: Map<
      string,
      {
        members: any[];
        membersLabel: string;
        totalSessions: number;
        upcomingSessions: number;
        completedSessions: number;
        cancelledSessions: number;
        totalRevenue: number;
        unscheduledSessions: number;
      }
    > = new Map();

    sessions.forEach((session) => {
      const members = Array.isArray(session.members) ? session.members : [];
      // Skip sessions with no members in the group context
      if (!members.length) return;

      const sortedIds = members
        .map((m) => m.id)
        .filter(Boolean)
        .sort();
      const groupKey = sortedIds.join('|');

      if (!groupMap.has(groupKey)) {
        const membersLabel = members
          .map((m) => m.name)
          .filter(Boolean)
          .join(', ');
        groupMap.set(groupKey, {
          members,
          membersLabel,
          totalSessions: 0,
          upcomingSessions: 0,
          completedSessions: 0,
          cancelledSessions: 0,
          totalRevenue: 0,
          unscheduledSessions: 0,
        });
      }

      const groupData = groupMap.get(groupKey)!;
      groupData.totalSessions++;

      if (session.isCancelled) {
        groupData.cancelledSessions++;
      } else if (
        session.sessionDate &&
        new Date(session.sessionDate) > new Date()
      ) {
        groupData.upcomingSessions++;
      } else if (!session.sessionDate) {
        // sessions not scheduled yet
        groupData.unscheduledSessions++;
      } else {
        groupData.completedSessions++;
      }

      if (session.sessionPrice) {
        groupData.totalRevenue += session.sessionPrice;
      }
    });

    return Array.from(groupMap.values());
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

    console.log('this is the memberId', memberId);
    const splitMemberIds = memberId.split(',');
    const trainer = await this.managerEntity.findOne({
      where: { id: trainerId },
    });
    if (!trainer) {
      throw new NotFoundException('Personal trainer not found');
    }

    const member = await this.memberEntity.find({
      where: { id: In(splitMemberIds) },
    });
    if (!member.length) {
      throw new NotFoundException('Member not found');
    }

    const sessions = await this.sessionEntity.find({
      where: {
        gym: { id: gymId },
        personalTrainer: { id: trainerId },
        members: { id: In(splitMemberIds) },
      },
      relations: {
        members: true,
        personalTrainer: true,
        gym: true,
        transactions: true,
      },
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

  async getTrainerGroupSessions(
    trainerId: string,
    gymId: string,
    memberIds: string[],
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

    const sessions = await this.sessionEntity.find({
      where: {
        gym: { id: gymId },
        personalTrainer: { id: trainerId },
      },
      relations: ['members', 'personalTrainer', 'gym'],
    });

    const targetKey = [...new Set(memberIds)].sort().join('|');

    const filtered = sessions.filter((session) => {
      const ids = (session.members || []).map((m) => m.id).filter(Boolean);
      const key = [...new Set(ids)].sort().join('|');
      return key === targetKey;
    });

    return filtered.sort((a, b) => {
      if (a.sessionDate && b.sessionDate) {
        return (
          new Date(a.sessionDate).getTime() - new Date(b.sessionDate).getTime()
        );
      }
      if (a.sessionDate && !b.sessionDate) {
        return -1;
      }
      if (!a.sessionDate && b.sessionDate) {
        return 1;
      }
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
        gym: { id: gymId },
        personalTrainer: { id: personalTrainer.id },
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
        gym: { id: gymId },
        personalTrainer: { id: personalTrainer.id },
      },
      relations: ['members', 'personalTrainer', 'gym'],
    });

    // Group sessions by the exact set of participating members
    // Key format: sorted member IDs joined by '|'
    const groupMap: Map<
      string,
      {
        members: any[];
        membersLabel: string;
        totalSessions: number;
        upcomingSessions: number;
        completedSessions: number;
        cancelledSessions: number;
        totalRevenue: number;
        unscheduledSessions: number;
      }
    > = new Map();

    sessions.forEach((session) => {
      const members = Array.isArray(session.members) ? session.members : [];
      // Skip sessions with no members in the group context
      if (!members.length) return;

      const sortedIds = members
        .map((m) => m.id)
        .filter(Boolean)
        .sort();
      const groupKey = sortedIds.join('|');

      if (!groupMap.has(groupKey)) {
        const membersLabel = members
          .map((m) => m.name)
          .filter(Boolean)
          .join(', ');
        groupMap.set(groupKey, {
          members,
          membersLabel,
          totalSessions: 0,
          upcomingSessions: 0,
          completedSessions: 0,
          cancelledSessions: 0,
          totalRevenue: 0,
          unscheduledSessions: 0,
        });
      }

      const groupData = groupMap.get(groupKey)!;
      groupData.totalSessions++;

      if (session.isCancelled) {
        groupData.cancelledSessions++;
      } else if (
        session.sessionDate &&
        new Date(session.sessionDate) > new Date()
      ) {
        groupData.upcomingSessions++;
      } else if (!session.sessionDate) {
        // sessions not scheduled yet
        groupData.unscheduledSessions++;
      } else {
        groupData.completedSessions++;
      }

      if (session.sessionPrice) {
        groupData.totalRevenue += session.sessionPrice;
      }
    });

    return Array.from(groupMap.values());
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

    const targetIds = memberId
      .split(',')
      .map((s) => s.trim())
      .filter((s) => !!s);

    // For single-member: keep existing behavior (sessions containing this member)
    if (targetIds.length <= 1) {
      const sessions = await this.sessionEntity.find({
        where: {
          gym: { id: gymId },
          personalTrainer: { id: personalTrainer.id },
          members: { id: In(targetIds) },
        },
        relations: ['members', 'personalTrainer', 'gym'],
      });
      return sessions.sort((a, b) => {
        if (a.sessionDate && b.sessionDate) {
          return (
            new Date(a.sessionDate).getTime() -
            new Date(b.sessionDate).getTime()
          );
        }
        if (a.sessionDate && !b.sessionDate) return -1;
        if (!a.sessionDate && b.sessionDate) return 1;
        return 0;
      });
    }

    // Multi-member: require sessions whose members set exactly matches targetIds
    const candidateSessions = await this.sessionEntity.find({
      where: {
        gym: { id: gymId },
        personalTrainer: { id: personalTrainer.id },
        members: { id: In(targetIds) },
      },
      relations: ['members', 'personalTrainer', 'gym'],
    });

    const targetKey = [...new Set(targetIds)].sort().join('|');
    const sessions = candidateSessions.filter((session) => {
      const ids = (session.members || []).map((m) => m.id).filter(Boolean);
      const key = [...new Set(ids)].sort().join('|');
      return key === targetKey;
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

  async deleteSession(sessionId: string) {
    console.log('this is the sessionId', sessionId);
    const session = await this.sessionEntity.findOne({
      where: { id: sessionId },
      relations: ['transaction', 'transactions'],
    });

    console.log('this is the session', session);

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    // Delete the associated legacy single transaction if it exists
    if (session.transaction) {
      await this.transactionService.deletePtSessionTransaction(
        session.transaction.id,
      );
    }

    // Delete all associated transactions linked via relatedPtSession if any
    if (session.transactions && session.transactions.length > 0) {
      for (const transaction of session.transactions) {
        await this.transactionService.deletePtSessionTransaction(
          transaction.id,
        );
      }
    }

    // Delete the session
    await this.sessionEntity.delete(sessionId);

    return {
      message: 'Session deleted successfully',
    };
  }
}
