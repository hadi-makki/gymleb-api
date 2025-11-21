import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { CreatePersonalScheduleDto } from './dto/create-personal-schedule.dto';
import { UpdatePersonalScheduleDto } from './dto/update-personal-schedule.dto';
import { PersonalScheduleEntity } from './entities/personal-schedule.entity';
import { GymEntity } from '../gym/entities/gym.entity';
import { MemberEntity } from '../member/entities/member.entity';
import { ManagerEntity } from '../manager/manager.entity';
import { NotFoundException } from '../error/not-found-error';
import { Permissions } from '../decorators/roles/role.enum';

@Injectable()
export class PersonalScheduleService {
  constructor(
    @InjectRepository(PersonalScheduleEntity)
    private readonly scheduleRepository: Repository<PersonalScheduleEntity>,
    @InjectRepository(GymEntity)
    private readonly gymRepository: Repository<GymEntity>,
    @InjectRepository(MemberEntity)
    private readonly memberRepository: Repository<MemberEntity>,
    @InjectRepository(ManagerEntity)
    private readonly managerRepository: Repository<ManagerEntity>,
  ) {}

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

  private formatDateInTimeZone(
    input: unknown,
    timeZone?: string,
  ): string | null {
    if (!input) return null;
    let epoch: number | null = null;
    if (input instanceof Date) {
      epoch = input.getTime();
    } else if (typeof input === 'string') {
      const raw = input.trim();
      if (!raw) return null;
      if (/[zZ]|[+-]\d{2}:?\d{2}$/.test(raw)) {
        const t = Date.parse(raw);
        epoch = Number.isNaN(t) ? null : t;
      } else {
        const tzForced = Date.parse(raw + 'Z');
        if (!Number.isNaN(tzForced)) epoch = tzForced;
      }
    }
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
      });
      const parts = formatter.formatToParts(date);
      const year = parts.find((p) => p.type === 'year')?.value;
      const month = parts.find((p) => p.type === 'month')?.value;
      const day = parts.find((p) => p.type === 'day')?.value;
      const hour = parts.find((p) => p.type === 'hour')?.value;
      const minute = parts.find((p) => p.type === 'minute')?.value;
      const second = parts.find((p) => p.type === 'second')?.value;
      if (year && month && day && hour && minute && second) {
        return `${year}-${month}-${day}T${hour}:${minute}:${second}`;
      }
    } catch {
      // Fallback to ISO string if timezone formatting fails
    }
    return date.toISOString();
  }

  private async isGymOwner(
    user: MemberEntity | ManagerEntity,
    gymId: string,
  ): Promise<boolean> {
    if (user instanceof MemberEntity) {
      return false;
    }
    const manager = user as ManagerEntity;
    if (manager.permissions.includes(Permissions.SuperAdmin)) {
      return true;
    }
    if (!manager.permissions.includes(Permissions.GymOwner)) {
      return false;
    }
    const gym = await this.gymRepository.findOne({
      where: { id: gymId },
      relations: ['owner'],
    });
    return gym?.owner?.id === manager.id;
  }

  async create(
    createPersonalScheduleDto: CreatePersonalScheduleDto,
    user: MemberEntity | ManagerEntity,
  ) {
    const gym = await this.gymRepository.findOne({
      where: { id: createPersonalScheduleDto.gymId },
    });
    if (!gym) {
      throw new NotFoundException('Gym not found');
    }

    const startDate = new Date(createPersonalScheduleDto.startDate);
    const durationHours = createPersonalScheduleDto.durationHours || 1;

    const schedule = this.scheduleRepository.create({
      title: createPersonalScheduleDto.title,
      description: createPersonalScheduleDto.description || null,
      startDate,
      durationHours,
      location: createPersonalScheduleDto.location || null,
      gym,
      userType: user instanceof MemberEntity ? 'member' : 'manager',
      member: user instanceof MemberEntity ? user : null,
      manager: user instanceof ManagerEntity ? user : null,
    });

    return await this.scheduleRepository.save(schedule);
  }

  async findAll(
    gymId: string,
    userId?: string,
    userType?: 'member' | 'manager',
    showAll?: boolean,
  ) {
    const gym = await this.gymRepository.findOne({ where: { id: gymId } });
    if (!gym) {
      throw new NotFoundException('Gym not found');
    }

    let whereCondition: any = {
      gym: { id: gymId },
    };

    // If showAll is false or not provided, filter by user
    if (!showAll && userId && userType) {
      if (userType === 'member') {
        whereCondition.member = { id: userId };
      } else {
        whereCondition.manager = { id: userId };
      }
    }

    const schedules = await this.scheduleRepository.find({
      where: whereCondition,
      relations: ['gym', 'member', 'manager'],
      order: {
        startDate: 'ASC',
      },
    });

    return schedules;
  }

  async findOne(id: string, userId?: string, userType?: 'member' | 'manager') {
    const schedule = await this.scheduleRepository.findOne({
      where: { id },
      relations: ['gym', 'member', 'manager'],
    });

    if (!schedule) {
      throw new NotFoundException('Personal schedule not found');
    }

    // Check ownership if userId and userType are provided
    if (userId && userType) {
      const isOwner =
        (userType === 'member' && schedule.memberId === userId) ||
        (userType === 'manager' && schedule.managerId === userId);
      if (!isOwner) {
        throw new ForbiddenException(
          'You do not have permission to access this schedule',
        );
      }
    }

    return schedule;
  }

  async update(
    id: string,
    updatePersonalScheduleDto: UpdatePersonalScheduleDto,
    userId: string,
    userType: 'member' | 'manager',
  ) {
    const schedule = await this.scheduleRepository.findOne({
      where: { id },
      relations: ['gym'],
    });

    if (!schedule) {
      throw new NotFoundException('Personal schedule not found');
    }

    // Check ownership
    const isOwner =
      (userType === 'member' && schedule.memberId === userId) ||
      (userType === 'manager' && schedule.managerId === userId);
    if (!isOwner) {
      throw new ForbiddenException(
        'You do not have permission to update this schedule',
      );
    }

    // Update fields
    if (updatePersonalScheduleDto.title !== undefined) {
      schedule.title = updatePersonalScheduleDto.title;
    }
    if (updatePersonalScheduleDto.description !== undefined) {
      schedule.description = updatePersonalScheduleDto.description || null;
    }
    if (updatePersonalScheduleDto.startDate) {
      schedule.startDate = new Date(updatePersonalScheduleDto.startDate);
    }
    if (updatePersonalScheduleDto.durationHours !== undefined) {
      schedule.durationHours = updatePersonalScheduleDto.durationHours || 1;
    }
    if (updatePersonalScheduleDto.location !== undefined) {
      schedule.location = updatePersonalScheduleDto.location || null;
    }

    return await this.scheduleRepository.save(schedule);
  }

  async remove(id: string, userId: string, userType: 'member' | 'manager') {
    const schedule = await this.scheduleRepository.findOne({
      where: { id },
    });

    if (!schedule) {
      throw new NotFoundException('Personal schedule not found');
    }

    // Check ownership
    const isOwner =
      (userType === 'member' && schedule.memberId === userId) ||
      (userType === 'manager' && schedule.managerId === userId);
    if (!isOwner) {
      throw new ForbiddenException(
        'You do not have permission to delete this schedule',
      );
    }

    await this.scheduleRepository.remove(schedule);
    return { message: 'Personal schedule deleted successfully' };
  }

  async getCalendarSchedules(
    gymId: string,
    startDate?: string,
    endDate?: string,
    userId?: string,
    userType?: 'member' | 'manager',
    showAll?: boolean,
    timezone?: string,
  ) {
    const gym = await this.gymRepository.findOne({ where: { id: gymId } });
    if (!gym) {
      throw new NotFoundException('Gym not found');
    }

    let whereCondition: any = {
      gym: { id: gymId },
    };

    // If showAll is false or not provided, filter by user
    if (!showAll && userId && userType) {
      if (userType === 'member') {
        whereCondition.member = { id: userId };
      } else {
        whereCondition.manager = { id: userId };
      }
    }

    // Add date filtering if provided
    if (startDate && endDate) {
      const hasTime =
        /[T ]\d{2}:\d{2}/.test(startDate) || /[T ]\d{2}:\d{2}/.test(endDate);
      if (hasTime) {
        whereCondition.startDate = Between(
          new Date(startDate),
          new Date(endDate),
        );
      } else {
        const rangeStart = this.getUtcDayRange(startDate).start;
        const rangeEnd = this.getUtcDayRange(endDate).end;
        whereCondition.startDate = Between(rangeStart, rangeEnd);
      }
    }

    const schedules = await this.scheduleRepository.find({
      where: whereCondition,
      relations: ['gym', 'member', 'manager'],
      order: {
        startDate: 'ASC',
      },
    });

    // Transform schedules for calendar view
    const calendarSchedules = schedules.map((schedule) => ({
      id: schedule.id,
      title: schedule.title,
      description: schedule.description,
      startDate: schedule.startDate,
      startDateTz: this.formatDateInTimeZone(schedule.startDate, timezone),
      durationHours: schedule.durationHours,
      location: schedule.location,
      userType: schedule.userType,
      member: schedule.member
        ? {
            id: schedule.member.id,
            name: schedule.member.name,
            email: schedule.member.email,
            phone: schedule.member.phone,
          }
        : null,
      manager: schedule.manager
        ? {
            id: schedule.manager.id,
            firstName: schedule.manager.firstName,
            lastName: schedule.manager.lastName,
            email: schedule.manager.email,
            phoneNumber: schedule.manager.phoneNumber,
          }
        : null,
      gym: {
        id: schedule.gym?.id,
        name: schedule.gym?.name,
      },
      createdAt: schedule.createdAt,
      updatedAt: schedule.updatedAt,
    }));

    return calendarSchedules;
  }
}
