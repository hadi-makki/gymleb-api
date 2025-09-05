import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MemberReservationEntity } from './entities/member-reservation.entity';
import { GymEntity } from '../gym/entities/gym.entity';
import { MemberEntity } from './entities/member.entity';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { GetAvailableSlotsDto } from './dto/get-available-slots.dto';
import { isUUID } from 'class-validator';

export interface TimeSlot {
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  currentReservations: number;
  maxReservations: number;
}

@Injectable()
export class MemberReservationService {
  constructor(
    @InjectRepository(MemberReservationEntity)
    private readonly reservationRepository: Repository<MemberReservationEntity>,
    @InjectRepository(GymEntity)
    private readonly gymRepository: Repository<GymEntity>,
    @InjectRepository(MemberEntity)
    private readonly memberRepository: Repository<MemberEntity>,
  ) {}

  async createReservation(
    memberId: string,
    createReservationDto: CreateReservationDto,
  ): Promise<MemberReservationEntity> {
    // Check if gym allows reservations
    const gym = await this.gymRepository.findOne({
      where: {
        ...(isUUID(createReservationDto.gymId)
          ? { id: createReservationDto.gymId }
          : { gymDashedName: createReservationDto.gymId }),
      },
    });

    if (!gym) {
      throw new NotFoundException('Gym not found');
    }

    if (!gym.allowUserResevations) {
      throw new BadRequestException('Gym does not allow user reservations');
    }

    // Check if member exists
    const member = await this.memberRepository.findOne({
      where: { id: memberId },
    });

    if (!member) {
      throw new NotFoundException('Member not found');
    }

    // Enforce 1 active reservation per member per day (replace if exists)
    const reservationDateOnly = new Date(createReservationDto.reservationDate);

    const existingForDay = await this.reservationRepository.findOne({
      where: {
        member: { id: memberId },
        gym: {
          ...(isUUID(createReservationDto.gymId)
            ? { id: createReservationDto.gymId }
            : { gymDashedName: createReservationDto.gymId }),
        },
        reservationDate: reservationDateOnly,
        isActive: true,
      },
    });

    // Count current reservations for requested slot (capacity check)
    const currentReservations = await this.reservationRepository.count({
      where: {
        gym: {
          ...(isUUID(createReservationDto.gymId)
            ? { id: createReservationDto.gymId }
            : { gymDashedName: createReservationDto.gymId }),
        },
        reservationDate: reservationDateOnly,
        startTime: createReservationDto.startTime,
        endTime: createReservationDto.endTime,
        isActive: true,
      },
    });

    const maxReservations = gym.allowedUserResevationsPerSession;

    if (existingForDay) {
      // If same slot, return existing
      if (
        existingForDay.startTime === createReservationDto.startTime &&
        existingForDay.endTime === createReservationDto.endTime
      ) {
        return existingForDay;
      }

      if (currentReservations >= maxReservations) {
        throw new BadRequestException('This time slot is fully booked');
      }

      // Update existing reservation times (replace)
      existingForDay.startTime = createReservationDto.startTime;
      existingForDay.endTime = createReservationDto.endTime;
      existingForDay.dayOfWeek = createReservationDto.dayOfWeek;
      existingForDay.notes = createReservationDto.notes;
      return this.reservationRepository.save(existingForDay);
    }

    if (currentReservations >= maxReservations) {
      throw new BadRequestException('This time slot is fully booked');
    }

    // Create new reservation
    const reservation = this.reservationRepository.create({
      member: member,
      gym: gym,
      reservationDate: reservationDateOnly,
      startTime: createReservationDto.startTime,
      endTime: createReservationDto.endTime,
      dayOfWeek: createReservationDto.dayOfWeek,
      notes: createReservationDto.notes,
    });

    return this.reservationRepository.save(reservation);
  }

  async getAvailableSlots(
    dayOfWeek: string,
    getAvailableSlotsDto: GetAvailableSlotsDto,
  ): Promise<TimeSlot[]> {
    const gym = await this.gymRepository.findOne({
      where: {
        ...(isUUID(getAvailableSlotsDto.gymId)
          ? {
              id: getAvailableSlotsDto.gymId,
            }
          : {
              gymDashedName: getAvailableSlotsDto.gymId,
            }),
      },
    });

    if (!gym) {
      throw new NotFoundException('Gym not found');
    }

    // Find the opening day configuration
    const openingDay = gym.openingDays.find(
      (day) => day.day.toLowerCase() === dayOfWeek.toLowerCase(),
    );

    if (!openingDay || !openingDay.isOpen) {
      return []; // Gym is closed on this day
    }

    // Generate time slots based on session duration
    const timeSlots = this.generateTimeSlots(
      openingDay.openingTime,
      openingDay.closingTime,
      gym.sessionTimeInHours,
    );

    // Get existing reservations for this date
    const existingReservations = await this.reservationRepository.find({
      where: {
        gym: {
          ...(isUUID(getAvailableSlotsDto.gymId)
            ? { id: getAvailableSlotsDto.gymId }
            : { gymDashedName: getAvailableSlotsDto.gymId }),
        },
        reservationDate: new Date(getAvailableSlotsDto.date),
        isActive: true,
      },
    });

    // Calculate availability for each slot
    const availableSlots: TimeSlot[] = timeSlots.map((slot) => {
      console.log('slot', slot);
      const slotReservations = existingReservations.filter(
        (reservation) =>
          reservation.startTime.includes(slot.startTime) &&
          reservation.endTime.includes(slot.endTime),
      );

      console.log('slotReservations', slotReservations);

      const currentReservations = slotReservations.length;
      const maxReservations = gym.allowedUserResevationsPerSession;
      const isAvailable = currentReservations < maxReservations;

      return {
        startTime: slot.startTime,
        endTime: slot.endTime,
        isAvailable,
        currentReservations,
        maxReservations,
      };
    });

    return availableSlots;
  }

  async getMemberReservations(
    memberId: string,
    gymId?: string,
  ): Promise<MemberReservationEntity[]> {
    return this.reservationRepository.find({
      where: {
        member: { id: memberId },
        gym: { ...(isUUID(gymId) ? { id: gymId } : { gymDashedName: gymId }) },
        isActive: true,
      },
      relations: ['gym'],
      order: { reservationDate: 'ASC', startTime: 'ASC' },
    });
  }

  async cancelReservation(
    memberId: string,
    reservationId: string,
  ): Promise<void> {
    const reservation = await this.reservationRepository.findOne({
      where: { id: reservationId, memberId, isActive: true },
    });

    if (!reservation) {
      throw new NotFoundException('Reservation not found');
    }

    reservation.isActive = false;
    await this.reservationRepository.save(reservation);
  }

  private generateTimeSlots(
    openingTime: string,
    closingTime: string,
    sessionDurationHours: number,
  ): { startTime: string; endTime: string }[] {
    const slots: { startTime: string; endTime: string }[] = [];

    const [openHour, openMinute] = openingTime.split(':').map(Number);
    const [closeHour, closeMinute] = closingTime.split(':').map(Number);

    const openTimeInMinutes = openHour * 60 + openMinute;
    const closeTimeInMinutes = closeHour * 60 + closeMinute;
    const sessionDurationInMinutes = sessionDurationHours * 60;

    let currentTimeInMinutes = openTimeInMinutes;

    while (
      currentTimeInMinutes + sessionDurationInMinutes <=
      closeTimeInMinutes
    ) {
      const startHour = Math.floor(currentTimeInMinutes / 60);
      const startMin = currentTimeInMinutes % 60;
      const endTimeInMinutes = currentTimeInMinutes + sessionDurationInMinutes;
      const endHour = Math.floor(endTimeInMinutes / 60);
      const endMin = endTimeInMinutes % 60;

      const startTime = `${startHour.toString().padStart(2, '0')}:${startMin.toString().padStart(2, '0')}`;
      const endTime = `${endHour.toString().padStart(2, '0')}:${endMin.toString().padStart(2, '0')}`;

      slots.push({ startTime, endTime });

      currentTimeInMinutes += sessionDurationInMinutes;
    }

    return slots;
  }
}
