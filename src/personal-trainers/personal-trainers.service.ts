import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { GymEntity } from 'src/gym/entities/gym.entity';
import { ManagerEntity } from 'src/manager/manager.entity';
import { ManagerService } from 'src/manager/manager.service';
import { MediaService } from 'src/media/media.service';
import { MemberEntity } from 'src/member/entities/member.entity';
import { TransactionService } from 'src/transactions/transaction.service';
import { Between, ILike, In, Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { Permissions } from '../decorators/roles/role.enum';
import { NotFoundException } from '../error/not-found-error';
import { AddPersonalTrainerDto } from './dto/add-personal-trainer.dto';
import { CreatePersonalTrainerDto } from './dto/create-personal-trainer.dto';
import { CreateSessionDto } from './dto/create-session.dto';
import { UpdatePersonalTrainerDto } from './dto/update-personal-trainer.dto';
import { UpdateSessionDto } from './dto/update-session.dto';
import { BulkUpdateSessionDatesDto } from './dto/bulk-update-session-dates.dto';
import { PTSessionEntity } from './entities/pt-sessions.entity';
import { isUUID } from 'class-validator';

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

  // Date helpers to ensure UTC-safe comparisons without static offsets
  private getUtcEpoch(input: unknown): number | null {
    if (!input) return null;
    if (input instanceof Date) {
      return input.getTime();
    }
    if (typeof input === 'string') {
      const raw = input.trim();
      if (!raw) return null;
      // If timezone info exists, rely on native parsing
      if (/[zZ]|[+-]\d{2}:?\d{2}$/.test(raw)) {
        const t = Date.parse(raw);
        return Number.isNaN(t) ? null : t;
      }
      // Parse common forms without timezone and treat as UTC
      const m = raw.match(
        /^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?)?$/,
      );
      if (m) {
        const year = Number(m[1]);
        const monthIndex = Number(m[2]) - 1;
        const day = Number(m[3]);
        const hour = m[4] ? Number(m[4]) : 0;
        const minute = m[5] ? Number(m[5]) : 0;
        const second = m[6] ? Number(m[6]) : 0;
        const ms = m[7] ? Number((m[7] + '00').slice(0, 3)) : 0;
        return Date.UTC(year, monthIndex, day, hour, minute, second, ms);
      }
      // Fallback: try interpreting as UTC by appending Z, then native
      const tzForced = Date.parse(raw + 'Z');
      if (!Number.isNaN(tzForced)) return tzForced;
      const native = Date.parse(raw);
      return Number.isNaN(native) ? null : native;
    }
    return null;
  }

  private compareBySessionDateAsc(
    a: PTSessionEntity,
    b: PTSessionEntity,
    timeZone?: string,
  ): number {
    const ta = this.getComparableInTimeZone(a.sessionDate as unknown, timeZone);
    const tb = this.getComparableInTimeZone(b.sessionDate as unknown, timeZone);
    if (ta !== null && tb !== null) return ta - tb;
    if (ta !== null) return -1;
    if (tb !== null) return 1;
    return 0;
  }

  private isSessionCompletedByNow(
    session: PTSessionEntity,
    timeZone?: string,
  ): boolean {
    const t = this.getComparableInTimeZone(
      session.sessionDate as unknown,
      timeZone,
    );
    if (t === null) return false;
    const nowCmp = this.getComparableInTimeZone(new Date(), timeZone)!;
    return t <= nowCmp;
  }

  private isSessionInFuture(
    session: PTSessionEntity,
    timeZone?: string,
  ): boolean {
    const t = this.getComparableInTimeZone(
      session.sessionDate as unknown,
      timeZone,
    );
    if (t === null) return false;
    const nowCmp = this.getComparableInTimeZone(new Date(), timeZone)!;
    return t > nowCmp;
  }

  private getUtcDayRange(dateInput: string): { start: Date; end: Date } {
    const onlyDate = (dateInput || '').trim().split('T')[0].split(' ')[0];
    const m = onlyDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (m) {
      const y = Number(m[1]);
      const mon = Number(m[2]) - 1;
      const d = Number(m[3]);
      const start = new Date(Date.UTC(y, mon, d, 0, 0, 0, 0));
      const end = new Date(Date.UTC(y, mon, d, 23, 59, 59, 999));
      return { start, end };
    }
    // Fallback: use native parsing but normalize to that day's UTC bounds
    const parsed = new Date(dateInput);
    const start = new Date(
      Date.UTC(
        parsed.getUTCFullYear(),
        parsed.getUTCMonth(),
        parsed.getUTCDate(),
        0,
        0,
        0,
        0,
      ),
    );
    const end = new Date(
      Date.UTC(
        parsed.getUTCFullYear(),
        parsed.getUTCMonth(),
        parsed.getUTCDate(),
        23,
        59,
        59,
        999,
      ),
    );
    return { start, end };
  }

  private getComparableInTimeZone(
    input: unknown,
    timeZone?: string,
  ): number | null {
    if (!input) return null;
    const date = input instanceof Date ? input : new Date(String(input));

    // If no timezone provided, use the date as-is (UTC)
    if (!timeZone) return date.getTime();

    try {
      // Get the local time components in the target timezone
      const formatter = new Intl.DateTimeFormat('en-CA', {
        timeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      } as any);

      const parts = formatter.formatToParts(date);
      const by = (t: string) => parts.find((p) => p.type === t)?.value || '00';

      const y = Number(by('year'));
      const m = Number(by('month'));
      const d = Number(by('day'));
      const hh = Number(by('hour'));
      const mm = Number(by('minute'));
      const ss = Number(by('second'));

      // Create a date string in the target timezone and parse it
      const localTimeString = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}T${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;

      // Use a more direct approach: create a date in the target timezone
      // by using the timezone offset
      const tempDate = new Date(localTimeString);

      // Get the timezone offset for this date
      const utcDate = new Date(
        tempDate.toLocaleString('en-US', { timeZone: 'UTC' }),
      );
      const targetDate = new Date(
        tempDate.toLocaleString('en-US', { timeZone }),
      );
      const offsetMs = targetDate.getTime() - utcDate.getTime();

      // Apply the offset to get the correct UTC timestamp
      return tempDate.getTime() - offsetMs;
    } catch (error) {
      console.error('Error in getComparableInTimeZone:', error);
      return date.getTime();
    }
  }

  // Format a UTC moment into the provided IANA timezone without static offsets.
  // Returns an ISO-like string (YYYY-MM-DDTHH:mm:ss) in that timezone.
  private formatDateInTimeZone(
    input: unknown,
    timeZone?: string,
  ): string | null {
    const epoch = this.getUtcEpoch(input as unknown);
    if (epoch === null) return null;
    const date = new Date(epoch);
    if (!timeZone) return date.toISOString();
    try {
      const formatter = new Intl.DateTimeFormat('en-CA', {
        timeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      } as any);
      const parts = formatter.formatToParts(date);
      const byType = (t: string) =>
        parts.find((p) => p.type === t)?.value || '00';
      const y = byType('year');
      const m = byType('month');
      const d = byType('day');
      const h = byType('hour');
      const min = byType('minute');
      const s = byType('second');
      return `${y}-${m}-${d}T${h}:${min}:${s}`;
    } catch {
      return date.toISOString();
    }
  }

  private attachTimezoneDate<T extends { sessionDate?: unknown }>(
    sessions: T[],
    timeZone?: string,
  ): (T & { sessionDateTz?: string | null })[] {
    if (!sessions || !Array.isArray(sessions)) return sessions as any;
    return sessions.map((s) => {
      (s as any).sessionDateTz = this.formatDateInTimeZone(
        s.sessionDate,
        timeZone,
      );
      return s as any;
    });
  }

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
      relations: ['members'],
    });
    console.log(
      'this is the trainer inside the removeClientFromTrainer',
      trainer,
    );
    if (!trainer) {
      console.log('we did not find the trainer');
      const findSessions = await this.sessionEntity.find({
        where: {
          members: { id: member.id },
        },
      });
      console.log('this is the sessions', findSessions);
      await this.sessionEntity.remove(findSessions);
      return;
    }

    await this.sessionEntity.delete({
      member: { id: member.id },
      personalTrainer: { id: trainer.id },
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

    // Update additional fields if provided
    const updateData: any = {};
    if (createPersonalTrainerDto.description) {
      updateData.description = createPersonalTrainerDto.description;
    }
    if (createPersonalTrainerDto.shiftStartTime) {
      updateData.shiftStartTime = createPersonalTrainerDto.shiftStartTime;
    }
    if (createPersonalTrainerDto.shiftEndTime) {
      updateData.shiftEndTime = createPersonalTrainerDto.shiftEndTime;
    }

    if (Object.keys(updateData).length > 0) {
      await this.personalTrainerEntity.update(personalTrainer.id, updateData);
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
      if (updatePersonalTrainerDto.description) {
        personalTrainer.description = updatePersonalTrainerDto.description;
      }
      if (updatePersonalTrainerDto.shiftStartTime) {
        personalTrainer.shiftStartTime =
          updatePersonalTrainerDto.shiftStartTime;
      }
      if (updatePersonalTrainerDto.shiftEndTime) {
        personalTrainer.shiftEndTime = updatePersonalTrainerDto.shiftEndTime;
      }
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
      if (updatePersonalTrainerDto.description) {
        personalTrainer.description = updatePersonalTrainerDto.description;
      }
      if (updatePersonalTrainerDto.shiftStartTime) {
        personalTrainer.shiftStartTime =
          updatePersonalTrainerDto.shiftStartTime;
      }
      if (updatePersonalTrainerDto.shiftEndTime) {
        personalTrainer.shiftEndTime = updatePersonalTrainerDto.shiftEndTime;
      }
      if (updatePersonalTrainerDto.password) {
        personalTrainer.password = await ManagerEntity.hashPassword(
          updatePersonalTrainerDto.password,
        );
      }
      await this.personalTrainerEntity.save(personalTrainer);
    }

    return { message: 'Personal trainer updated successfully' };
  }

  async remove(id: string) {
    const personalTrainer = await this.personalTrainerEntity.findOne({
      where: { id },
      relations: ['ptSessions'],
    });
    if (!personalTrainer) {
      throw new NotFoundException('Personal trainer not found');
    }
    if (personalTrainer.ptSessions.length > 0) {
      for (const session of personalTrainer.ptSessions) {
        await this.deleteSession(session.id);
      }
    }
    await this.personalTrainerEntity.delete(id);
    return { message: 'Personal trainer deleted successfully' };
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

  async createSession(
    gymId: string,
    createSessionDto: CreateSessionDto,
    timezone?: string,
  ) {
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

    // Convert the date to UTC if timezone is provided
    let sessionDate = createSessionDto.date;
    if (timezone && createSessionDto.date) {
      // The date comes as a naive string (e.g., "2025-10-04T19:39:00")
      // We need to treat it as local time in the provided timezone and convert to UTC
      const naiveDate = new Date(createSessionDto.date);

      // Get the timezone offset for this date
      const utcDate = new Date(
        naiveDate.toLocaleString('en-US', { timeZone: 'UTC' }),
      );
      const targetDate = new Date(
        naiveDate.toLocaleString('en-US', { timeZone: timezone }),
      );
      const offsetMs = targetDate.getTime() - utcDate.getTime();

      // Apply the offset to get the correct UTC timestamp
      sessionDate = new Date(naiveDate.getTime() - offsetMs).toISOString();
    }

    for (let i = 0; i < createSessionDto.numberOfSessions; i++) {
      const createSessionModel = this.sessionEntity.create({
        members,
        personalTrainer: checkIfPersonalTrainerInGym,
        gym: gym,
        sessionPrice: createSessionDto.sessionPrice,
        sessionDate: !setDateDone ? sessionDate : null,
      });
      const createdSession = await this.sessionEntity.save(createSessionModel);
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
    const gym = await this.gymEntity.findOne({
      where: { ...(isUUID(gymId) ? { id: gymId } : { gymDashedName: gymId }) },
    });
    if (!gym) {
      throw new NotFoundException('Gym not found');
    }

    // Use a simpler approach to find personal trainers
    const allManagers = await this.personalTrainerEntity.find({
      where: {
        gyms: { ...(isUUID(gymId) ? { id: gymId } : { gymDashedName: gymId }) },
      },
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
          gym: {
            ...(isUUID(gymId) ? { id: gymId } : { gymDashedName: gymId }),
          },
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
      updateData.sessionDate = updateSessionDto.date;
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

  private weekdayToIndex(weekday: string): number {
    const map: Record<string, number> = {
      sunday: 0,
      monday: 1,
      tuesday: 2,
      wednesday: 3,
      thursday: 4,
      friday: 5,
      saturday: 6,
    };
    return map[weekday.toLowerCase()];
  }

  private getNextOccurrence(
    weekdayIndex: number,
    timeHHmm: string,
    timeZone?: string,
  ): Date {
    // Compute today's date at 00:00 in the target timezone
    const now = new Date();
    let baseUtcMidnight = new Date(
      Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate(),
        0,
        0,
        0,
        0,
      ),
    );
    if (timeZone) {
      try {
        const fmt = new Intl.DateTimeFormat('en-CA', {
          timeZone,
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
        } as any);
        const parts = fmt.formatToParts(now);
        const get = (t: string) =>
          parts.find((p) => p.type === t)?.value || '00';
        const y = Number(get('year'));
        const m = Number(get('month')) - 1;
        const d = Number(get('day'));
        baseUtcMidnight = new Date(Date.UTC(y, m, d, 0, 0, 0, 0));
      } catch {
        // fallback keeps baseUtcMidnight as UTC today
      }
    }

    // Day index in the target timezone (using UTC midnight of that local day)
    const todayIndex = baseUtcMidnight.getUTCDay();
    let delta = weekdayIndex - todayIndex;
    if (delta < 0) delta += 7;

    // Tentative date (keep time as specified in the target timezone by composing at local midnight UTC)
    const [hh, mm] = timeHHmm.split(':').map((n) => parseInt(n, 10));
    const candidate = new Date(
      baseUtcMidnight.getTime() + delta * 24 * 60 * 60 * 1000,
    );
    candidate.setUTCHours(hh, mm, 0, 0);

    // If today is the same weekday but time already passed (compare instants), move to next week
    if (candidate.getTime() <= now.getTime()) {
      candidate.setDate(candidate.getDate() + 7);
    }
    return candidate;
  }

  async bulkUpdateSessionDates(
    dto: BulkUpdateSessionDatesDto,
    timezone?: string,
  ) {
    const { sessionIds, weekday, time } = dto;
    if (!sessionIds || sessionIds.length === 0) {
      throw new BadRequestException('No session IDs provided');
    }

    const weekdayIndex = this.weekdayToIndex(weekday);
    if (weekdayIndex === undefined || Number.isNaN(weekdayIndex)) {
      throw new BadRequestException('Invalid weekday');
    }

    // Load sessions preserving input order
    const sessions = await this.sessionEntity.find({
      where: { id: In(sessionIds) },
      relations: ['members', 'personalTrainer', 'gym'],
    });
    const byId = new Map(sessions.map((s) => [s.id, s] as const));
    const orderedSessions = sessionIds
      .map((id) => byId.get(id))
      .filter((s): s is PTSessionEntity => !!s);

    if (orderedSessions.length !== sessionIds.length) {
      throw new NotFoundException('One or more sessions not found');
    }

    // Compute starting occurrence and then +1 week per session (respect timezone for the base day/time)
    let nextDate = this.getNextOccurrence(weekdayIndex, time, timezone);
    for (const session of orderedSessions) {
      session.sessionDate = new Date(nextDate);
      // next week
      nextDate = new Date(nextDate.getTime() + 7 * 24 * 60 * 60 * 1000);
    }

    await this.sessionEntity.save(orderedSessions);
    return { message: 'Sessions dates updated successfully' };
  }

  async getTrainerSessions(
    trainerId: string,
    gymId: string,
    timezone?: string,
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
      relations: ['member', 'personalTrainer', 'gym'],
    });

    // Sort sessions: sessions with dates first (by date), then sessions without dates
    return sessions.sort((a, b) =>
      this.compareBySessionDateAsc(a, b, timezone),
    );
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
      } else if (this.isSessionInFuture(session)) {
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
    status?: 'active' | 'inactive',
    timezone?: string,
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

    const targetIds = splitMemberIds.map((s) => s.trim()).filter(Boolean);

    // Single-member: simple IN filter
    if (targetIds.length <= 1) {
      const sessions = await this.sessionEntity.find({
        where: {
          gym: { id: gymId },
          personalTrainer: { id: trainerId },
          members: { id: In(targetIds) },
        },
        relations: {
          members: true,
          personalTrainer: true,
          gym: true,
          transactions: true,
        },
      });

      const sortedSessions = sessions.sort((a, b) =>
        this.compareBySessionDateAsc(a, b, timezone),
      );

      // Apply status filtering if provided
      if (status) {
        const filtered = sortedSessions.filter((session) => {
          const isCompleted = this.isSessionCompletedByNow(session, timezone);
          const isCancelled = session.isCancelled;
          if (status === 'active') return !isCompleted && !isCancelled;
          if (status === 'inactive') return isCompleted || isCancelled;
          return true;
        });
        return this.attachTimezoneDate(filtered, timezone);
      }

      return this.attachTimezoneDate(sortedSessions, timezone);
    }

    // Multi-member: require sessions whose members set exactly matches targetIds
    const candidateSessions = await this.sessionEntity.find({
      where: {
        gym: { id: gymId },
        personalTrainer: { id: trainerId },
        members: { id: In(targetIds) },
      },
      relations: {
        members: true,
        personalTrainer: true,
        gym: true,
        transactions: true,
      },
    });

    const targetKey = [...new Set(targetIds)].sort().join('|');
    const sessions = candidateSessions.filter((session) => {
      const ids = (session.members || []).map((m) => m.id).filter(Boolean);
      const key = [...new Set(ids)].sort().join('|');
      return key === targetKey;
    });

    // Sort sessions: sessions with dates first (by date), then sessions without dates
    const sortedSessions = sessions.sort((a, b) =>
      this.compareBySessionDateAsc(a, b, timezone),
    );

    // Apply status filtering if provided
    if (status) {
      const filtered = sortedSessions.filter((session) => {
        const isCompleted = this.isSessionCompletedByNow(session, timezone);
        const isCancelled = session.isCancelled;
        if (status === 'active') return !isCompleted && !isCancelled;
        if (status === 'inactive') return isCompleted || isCancelled;
        return true;
      });
      return this.attachTimezoneDate(filtered, timezone);
    }

    return this.attachTimezoneDate(sortedSessions, timezone);
  }

  async debugGetTrainerClientSessions(
    trainerId: string,
    gymId: string,
    memberId: string,
    timezone?: string,
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

    const member = await this.memberEntity.findOne({
      where: { id: memberId },
    });
    if (!member) {
      throw new NotFoundException('Member not found');
    }

    const sessions = await this.sessionEntity.find({
      where: {
        gym: { id: gymId },
        personalTrainer: { id: trainerId },
        members: { id: memberId },
      },
      relations: {
        members: true,
        personalTrainer: true,
        gym: true,
        transactions: true,
      },
    });

    const currentDate = new Date();
    const currentDateInTz = timezone
      ? this.formatDateInTimeZone(currentDate, timezone)
      : currentDate.toISOString();

    return sessions.map((session) => {
      const sessionDateInTz = this.formatDateInTimeZone(
        session.sessionDate,
        timezone,
      );
      const isCompleted = this.isSessionCompletedByNow(session, timezone);
      const isUpcoming = this.isSessionInFuture(session, timezone);
      const isUnscheduled = !session.sessionDate;
      const isDateSet = !!session.sessionDate;
      const isDateNotSet = !session.sessionDate;

      // Debug: Get the comparable timestamps
      const sessionComparable = this.getComparableInTimeZone(
        session.sessionDate,
        timezone,
      );
      const currentComparable = this.getComparableInTimeZone(
        currentDate,
        timezone,
      );

      return {
        sessionId: session.id,
        sessionName: `Session ${session.id.slice(0, 8)}`,
        sessionDate: session.sessionDate,
        sessionDateInTz,
        currentDate: currentDate,
        currentRawDate: new Date().toISOString(),
        currentDateInTz,
        timezone,
        // Debug info
        sessionComparable,
        currentComparable,
        comparison:
          sessionComparable && currentComparable
            ? sessionComparable - currentComparable
            : null,
        type: isCompleted
          ? 'completed'
          : session.isCancelled
            ? 'cancelled'
            : isUpcoming
              ? 'upcoming'
              : isUnscheduled
                ? 'unscheduled'
                : 'date-not-set',
        isDateSet,
        isDateNotSet,
        sessionPrice: session.sessionPrice,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
      };
    });
  }

  async getTrainerGroupSessions(
    trainerId: string,
    gymId: string,
    memberIds: string[],
    status?: 'active' | 'inactive',
    timezone?: string,
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

    const sortedSessions = filtered.sort((a, b) =>
      this.compareBySessionDateAsc(a, b),
    );

    // Apply status filtering if provided
    if (status) {
      const filtered = sortedSessions.filter((session) => {
        const isCompleted = this.isSessionCompletedByNow(session, timezone);
        const isCancelled = session.isCancelled;
        if (status === 'active') return !isCompleted && !isCancelled;
        if (status === 'inactive') return isCompleted || isCancelled;
        return true;
      });
      return this.attachTimezoneDate(filtered, timezone);
    }

    return this.attachTimezoneDate(sortedSessions, timezone);
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
    return sessions.sort((a, b) => this.compareBySessionDateAsc(a, b));
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
      } else if (this.isSessionInFuture(session)) {
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
    timezone?: string,
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
      return this.attachTimezoneDate(
        sessions.sort((a, b) => this.compareBySessionDateAsc(a, b, timezone)),
        timezone,
      );
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
    return this.attachTimezoneDate(
      sessions.sort((a, b) => this.compareBySessionDateAsc(a, b, timezone)),
      timezone,
    );
  }

  async deleteSession(sessionId: string) {
    console.log('this is the sessionId', sessionId);
    const session = await this.sessionEntity.findOne({
      where: { id: sessionId },
      relations: {
        transaction: true,
        transactions: true,
      },
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

  async getCalendarSessions(
    gymId: string,
    startDate?: string,
    endDate?: string,
    timezone?: string,
  ) {
    const checkGym = await this.gymEntity.findOne({ where: { id: gymId } });
    if (!checkGym) {
      throw new NotFoundException('Gym not found');
    }

    let whereCondition: any = {
      gym: { id: gymId },
    };

    // Add date filtering if provided (use UTC day bounds when only dates provided)
    if (startDate && endDate) {
      const hasTime =
        /[T ]\d{2}:\d{2}/.test(startDate) || /[T ]\d{2}:\d{2}/.test(endDate);
      if (hasTime) {
        whereCondition.sessionDate = Between(
          new Date(startDate),
          new Date(endDate),
        );
      } else {
        const rangeStart = this.getUtcDayRange(startDate).start;
        const rangeEnd = this.getUtcDayRange(endDate).end;
        whereCondition.sessionDate = Between(rangeStart, rangeEnd);
      }
    }

    const sessions = await this.sessionEntity.find({
      where: whereCondition,
      relations: ['personalTrainer', 'members', 'gym', 'transactions'],
      order: {
        sessionDate: 'ASC',
      },
    });

    // Transform sessions for calendar view
    const calendarSessions = sessions.map((session) => ({
      id: session.id,
      personalTrainer: {
        id: session.personalTrainer?.id,
        firstName: session.personalTrainer?.firstName,
        lastName: session.personalTrainer?.lastName,
        email: session.personalTrainer?.email,
        phone: session.personalTrainer?.phoneNumber,
      },
      members:
        session.members?.map((member) => ({
          id: member.id,
          name: member.name,
          phone: member.phone,
          email: member.email,
        })) || [],
      sessionDate: session.sessionDate,
      sessionDateTz: this.formatDateInTimeZone(session.sessionDate, timezone),
      isCancelled: session.isCancelled,
      cancelledReason: session.cancelledReason,
      cancelledAt: session.cancelledAt,
      sessionPrice: session.sessionPrice,
      gym: {
        id: session.gym?.id,
        name: session.gym?.name,
      },
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
    }));

    return calendarSessions;
  }

  async getSessionsByDate(
    gymId: string,
    date: string,
    filterBy: 'time' | 'owner' = 'time',
    trainerId: string,
    timezone?: string,
  ) {
    const { start: startDate, end: endDate } = this.getUtcDayRange(date);

    const sessions = await this.sessionEntity.find({
      where: {
        gym: { id: gymId },
        ...(trainerId ? { personalTrainer: { id: trainerId } } : {}),
        sessionDate: Between(startDate, endDate),
      },
      relations: [
        'personalTrainer',
        'members',
        'gym',
        'personalTrainer.profileImage',
      ],
      order: {
        sessionDate: 'ASC',
      },
    });

    if (filterBy === 'time') {
      return this.groupSessionsByTime(sessions, timezone);
    } else {
      return this.groupSessionsByOwner(sessions);
    }
  }

  async getAllSessionsByDate(
    date: string,
    filterBy: 'time' | 'owner' = 'time',
    trainerId: string,
    timezone?: string,
  ) {
    const { start: startDate, end: endDate } = this.getUtcDayRange(date);

    const sessions = await this.sessionEntity.find({
      where: {
        ...(trainerId ? { personalTrainer: { id: trainerId } } : {}),
        sessionDate: Between(startDate, endDate),
      },
      relations: [
        'personalTrainer',
        'members',
        'gym',
        'personalTrainer.profileImage',
      ],
      order: {
        sessionDate: 'ASC',
      },
    });

    if (filterBy === 'time') {
      return this.groupSessionsByTime(sessions, timezone);
    } else {
      return this.groupSessionsByOwner(sessions);
    }
  }

  async getMySessionsByDate(
    trainerId: string,
    gymId: string,
    date: string,
    filterBy: 'time' | 'owner' = 'time',
    timezone?: string,
  ) {
    const { start: startDate, end: endDate } = this.getUtcDayRange(date);

    const sessions = await this.sessionEntity.find({
      where: {
        personalTrainer: { id: trainerId },
        gym: { id: gymId },
        sessionDate: Between(startDate, endDate),
      },
      relations: [
        'personalTrainer',
        'members',
        'gym',
        'personalTrainer.profileImage',
      ],
      order: {
        sessionDate: 'ASC',
      },
    });

    if (filterBy === 'time') {
      return this.groupSessionsByTime(sessions, timezone);
    } else {
      return this.groupSessionsByOwner(sessions);
    }
  }

  private groupSessionsByTime(sessions: PTSessionEntity[], timezone?: string) {
    const timeGroups = new Map<string, PTSessionEntity[]>();

    sessions.forEach((session) => {
      let timeKey = 'No Time';
      if (session.sessionDate) {
        const formatted = this.formatDateInTimeZone(
          session.sessionDate,
          timezone,
        );
        timeKey = formatted ? formatted.slice(11, 16) : 'No Time';
      }

      if (!timeGroups.has(timeKey)) {
        timeGroups.set(timeKey, []);
      }
      timeGroups.get(timeKey)!.push(session);
    });

    const groups = Array.from(timeGroups.entries()).map(
      ([time, groupSessions]) => ({
        id: time.replace(':', '-'),
        label: time === 'No Time' ? 'No Time Set' : this.formatTime(time),
        sessions: groupSessions.map(this.formatSessionForResponse.bind(this)),
      }),
    );

    return {
      filterBy: 'time' as const,
      groups: groups.sort((a, b) => a.label.localeCompare(b.label)),
    };
  }

  private groupSessionsByOwner(sessions: PTSessionEntity[]) {
    const ownerGroups = new Map<string, PTSessionEntity[]>();

    sessions.forEach((session) => {
      const ownerKey = `${session.personalTrainer.firstName} ${session.personalTrainer.lastName}`;

      if (!ownerGroups.has(ownerKey)) {
        ownerGroups.set(ownerKey, []);
      }
      ownerGroups.get(ownerKey)!.push(session);
    });

    const groups = Array.from(ownerGroups.entries()).map(
      ([owner, groupSessions]) => ({
        id: owner.replace(/\s+/g, '-').toLowerCase(),
        label: owner,
        sessions: groupSessions.map(this.formatSessionForResponse.bind(this)),
      }),
    );

    return {
      filterBy: 'owner' as const,
      groups: groups.sort((a, b) => a.label.localeCompare(b.label)),
    };
  }

  private formatTime(time: string): string {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  }

  private formatSessionForResponse(session: PTSessionEntity) {
    return {
      id: session.id,
      personalTrainer: {
        id: session.personalTrainer.id,
        firstName: session.personalTrainer.firstName,
        lastName: session.personalTrainer.lastName,
        email: session.personalTrainer.email,
        phoneNumber: session.personalTrainer.phoneNumber,
        profileImage: session.personalTrainer.profileImage,
      },
      members: session.members.map((member) => ({
        id: member.id,
        name: member.name,
        phone: member.phone,
      })),
      gym: {
        id: session.gym?.id,
        name: session.gym?.name,
      },
      sessionDate: session.sessionDate,
      isCancelled: session.isCancelled,
      cancelledReason: session.cancelledReason,
      cancelledAt: session.cancelledAt,
      sessionPrice: session.sessionPrice,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
    };
  }
}
