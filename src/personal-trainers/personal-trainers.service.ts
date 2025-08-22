import { BadRequestException, Injectable } from '@nestjs/common';
import { CreatePersonalTrainerDto } from './dto/create-personal-trainer.dto';
import { UpdatePersonalTrainerDto } from './dto/update-personal-trainer.dto';
import { Model, Types } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Permissions } from '../decorators/roles/role.enum';
import { User } from '../user/user.entity';
import { AddPersonalTrainerDto } from './dto/add-personal-trainer.dto';
import { NotFoundException } from '../error/not-found-error';
import { CreateSessionDto } from './dto/create-session.dto';
import { UpdateSessionDto } from './dto/update-session.dto';
import { PTSession } from './entities/pt-sessions.entity';
import { Gym } from 'src/gym/entities/gym.entity';
import { Member } from 'src/member/entities/member.entity';
import { Manager } from 'src/manager/manager.entity';
import { ManagerService } from 'src/manager/manager.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class PersonalTrainersService {
  constructor(
    @InjectModel(Manager.name)
    private readonly personalTrainerEntity: Model<Manager>,
    @InjectModel(User.name)
    private readonly userEntity: Model<User>,
    @InjectModel(PTSession.name)
    private readonly sessionEntity: Model<PTSession>,
    @InjectModel(Gym.name)
    private readonly gymEntity: Model<Gym>,
    @InjectModel(Member.name)
    private readonly memberEntity: Model<Member>,
    @InjectModel(Manager.name)
    private readonly managerEntity: Model<Manager>,
    private readonly managerService: ManagerService,
  ) {}

  async create(
    createPersonalTrainerDto: CreatePersonalTrainerDto,
    gymId: string,
  ) {
    const gym = await this.gymEntity.findById(gymId);
    if (!gym) {
      throw new NotFoundException('Gym not found');
    }

    const checkIfPersonalTrainerExists =
      (await this.personalTrainerEntity.findOne({
        phoneNumber: createPersonalTrainerDto.phone,
      })) ||
      (await this.managerEntity.findOne({
        phoneNumber: createPersonalTrainerDto.phone,
      }));

    if (checkIfPersonalTrainerExists) {
      throw new BadRequestException('Personal trainer already exists');
    }

    const personalTrainer = await this.managerService.createManager(
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
    );
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

  findAllUsers(personalTrainer: Manager) {
    return this.userEntity.find({ personalTrainer: personalTrainer._id });
  }

  async addUserToPersonalTrainer(
    addPersonalTrainerDto: AddPersonalTrainerDto,
    personalTrainer: Manager,
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

  async createSession(gymId: string, createSessionDto: CreateSessionDto) {
    const gym = await this.gymEntity.findById(gymId);
    if (!gym) {
      throw new NotFoundException('Gym not found');
    }

    const checkIfUserInGym = await this.memberEntity
      .findById(createSessionDto.memberId)
      .populate({
        path: 'gym',
        select: '_id name',
      });

    if (
      !checkIfUserInGym ||
      (checkIfUserInGym.gym._id.toString() !== gymId &&
        !(checkIfUserInGym.gym._id as any).equals(new Types.ObjectId(gymId)))
    ) {
      throw new NotFoundException('Member not found in gym');
    }

    const checkIfPersonalTrainerInGym = await this.personalTrainerEntity
      .findById(createSessionDto.personalTrainerId)
      .populate({
        path: 'gyms',
        select: '_id name',
      });

    if (
      !checkIfPersonalTrainerInGym ||
      !checkIfPersonalTrainerInGym.gyms.some(
        (gym: any) =>
          gym._id.toString() === gymId ||
          gym._id.equals(new Types.ObjectId(gymId)),
      )
    ) {
      throw new NotFoundException('Personal trainer not found in gym');
    }

    let setDateDone = false;

    for (let i = 0; i < createSessionDto.numberOfSessions; i++) {
      const session = await this.sessionEntity.create({
        member: checkIfUserInGym,
        personalTrainer: checkIfPersonalTrainerInGym,
        gym: gym,
        sessionPrice: createSessionDto.sessionPrice,
        sessionDate: !setDateDone ? new Date(createSessionDto.date) : null,
      });
      await this.memberEntity.findByIdAndUpdate(
        checkIfUserInGym._id,
        {
          $push: { sessions: session._id },
        },
        { new: true },
      );
      setDateDone = true;
    }

    return {
      message: 'Sessions created successfully',
    };
  }

  async findAllSessions(gymId: string, personalTrainer: Manager) {
    const checkGym = await this.gymEntity.findById(gymId);
    if (!checkGym) {
      throw new NotFoundException('Gym not found');
    }

    // Check if the user is a personal trainer (not gym owner or super admin)
    const isPersonalTrainer =
      personalTrainer.roles.includes(Permissions.personalTrainers) &&
      !personalTrainer.roles.includes(Permissions.GymOwner) &&
      !personalTrainer.roles.includes(Permissions.SuperAdmin);

    return await this.sessionEntity
      .find({
        gym: checkGym._id,
        ...(isPersonalTrainer ? { personalTrainer: personalTrainer._id } : {}),
      })
      .populate({
        path: 'member',
        select: '_id name phone email',
      })
      .populate({
        path: 'personalTrainer',
        select: '_id firstName lastName username',
      })
      .populate({
        path: 'gym',
        select: '_id name',
      })
      .sort({ sessionDate: 1 });
  }

  async findByGym(gymId: string) {
    const gym = await this.gymEntity.findById(gymId);
    if (!gym) {
      throw new NotFoundException('Gym not found');
    }

    const personalTrainers = await this.personalTrainerEntity
      .find({
        gyms: { $in: [gym._id] },
        roles: { $in: [Permissions.personalTrainers] },
      })
      .populate({
        path: 'gyms',
      });

    const sessionsResult: { personalTrainer: Manager; clientsCount: number }[] =
      [];

    for (const personalTrainer of personalTrainers) {
      const sessions = await this.sessionEntity
        .find({
          personalTrainer: personalTrainer._id,
        })
        .populate({
          path: 'member',
        });
      const clients = sessions.map((session) => session.member.id);
      // filter out duplicates
      const uniqueClients = [...new Set(clients)];
      sessionsResult.push({
        personalTrainer,
        clientsCount: uniqueClients.length,
      });
    }

    return sessionsResult;
  }

  async getGymMembers(gymId: string) {
    const gym = await this.gymEntity.findById(gymId);
    if (!gym) {
      throw new NotFoundException('Gym not found');
    }

    return await this.memberEntity.find({ gym: gym.id });
  }

  async cancelSession(sessionId: string, reason: string) {
    const session = await this.sessionEntity.findById(sessionId);
    if (!session) {
      throw new NotFoundException('Session not found');
    }

    await this.sessionEntity.findByIdAndUpdate(sessionId, {
      isCancelled: true,
      cancelledReason: reason,
      cancelledAt: new Date(),
    });

    return {
      message: 'Session cancelled successfully',
    };
  }

  async updateSession(sessionId: string, updateSessionDto: UpdateSessionDto) {
    const session = await this.sessionEntity.findById(sessionId);
    if (!session) {
      throw new NotFoundException('Session not found');
    }

    const updateData: any = {};

    // Update member if provided
    if (updateSessionDto.memberId) {
      const member = await this.memberEntity.findById(
        updateSessionDto.memberId,
      );
      if (!member) {
        throw new NotFoundException('Member not found');
      }
      updateData.member = member._id;
    }

    // Update session date if provided
    if (updateSessionDto.date) {
      updateData.sessionDate = new Date(updateSessionDto.date);
    }

    // Update session price if provided
    if (updateSessionDto.sessionPrice !== undefined) {
      updateData.sessionPrice = updateSessionDto.sessionPrice;
    }

    await this.sessionEntity.findByIdAndUpdate(sessionId, updateData);

    return {
      message: 'Session updated successfully',
    };
  }

  async getTrainerSessions(trainerId: string, gymId: string) {
    const gym = await this.gymEntity.findById(gymId);
    if (!gym) {
      throw new NotFoundException('Gym not found');
    }

    const trainer = await this.managerEntity.findById(trainerId);
    if (!trainer) {
      throw new NotFoundException('Personal trainer not found');
    }

    const sessions = await this.sessionEntity
      .find({
        gym: gym._id,
        personalTrainer: trainer._id,
      })
      .populate({
        path: 'member',
        select: '_id name phone email',
      })
      .populate({
        path: 'personalTrainer',
        select: '_id firstName lastName username',
      })
      .populate({
        path: 'gym',
        select: '_id name',
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
    const gym = await this.gymEntity.findById(gymId);
    if (!gym) {
      throw new NotFoundException('Gym not found');
    }

    const trainer = await this.managerEntity.findById(trainerId);
    if (!trainer) {
      throw new NotFoundException('Personal trainer not found');
    }

    // Get all sessions for this trainer
    const sessions = await this.sessionEntity
      .find({
        gym: gym._id,
        personalTrainer: trainer._id,
      })
      .populate({
        path: 'member',
        select: '_id name phone email',
      });

    // Get unique members and their session counts
    const memberMap = new Map();

    sessions.forEach((session) => {
      const memberId = session.member._id.toString();
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
    const gym = await this.gymEntity.findById(gymId);
    if (!gym) {
      throw new NotFoundException('Gym not found');
    }

    const trainer = await this.managerEntity.findById(trainerId);
    if (!trainer) {
      throw new NotFoundException('Personal trainer not found');
    }

    const member = await this.memberEntity.findById(memberId);
    if (!member) {
      throw new NotFoundException('Member not found');
    }

    const sessions = await this.sessionEntity
      .find({
        gym: gym._id,
        personalTrainer: trainer._id,
        member: member._id,
      })
      .populate({
        path: 'member',
        select: '_id name phone email',
      })
      .populate({
        path: 'personalTrainer',
        select: '_id firstName lastName username',
      })
      .populate({
        path: 'gym',
        select: '_id name',
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

  async mySessions(gymId: string, personalTrainer: Manager) {
    const gym = await this.gymEntity.findById(gymId);
    if (!gym) {
      throw new NotFoundException('Gym not found');
    }

    const sessions = await this.sessionEntity
      .find({
        gym: gym._id,
        personalTrainer: personalTrainer._id,
      })
      .populate({
        path: 'member',
        select: '_id name phone email',
      })
      .populate({
        path: 'personalTrainer',
        select: '_id firstName lastName username',
      })
      .populate({
        path: 'gym',
        select: '_id name',
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

  async myClients(gymId: string, personalTrainer: Manager) {
    const gym = await this.gymEntity.findById(gymId);
    if (!gym) {
      throw new NotFoundException('Gym not found');
    }

    // Get all sessions for this trainer
    const sessions = await this.sessionEntity
      .find({
        gym: gym._id,
        personalTrainer: personalTrainer._id,
      })
      .populate({
        path: 'member',
        select: '_id name phone email',
      });

    // Get unique members and their session counts
    const memberMap = new Map();

    sessions.forEach((session) => {
      const memberId = session.member._id.toString();
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
    personalTrainer: Manager,
  ) {
    const gym = await this.gymEntity.findById(gymId);
    if (!gym) {
      throw new NotFoundException('Gym not found');
    }

    const member = await this.memberEntity.findById(memberId);
    if (!member) {
      throw new NotFoundException('Member not found');
    }

    const sessions = await this.sessionEntity
      .find({
        gym: gym._id,
        personalTrainer: personalTrainer._id,
        member: member._id,
      })
      .populate({
        path: 'member',
        select: '_id name phone email',
      })
      .populate({
        path: 'personalTrainer',
        select: '_id firstName lastName username',
      })
      .populate({
        path: 'gym',
        select: '_id name',
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
