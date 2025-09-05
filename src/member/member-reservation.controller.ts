import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import {
  MemberReservationService,
  TimeSlot,
} from './member-reservation.service';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { GetAvailableSlotsDto } from './dto/get-available-slots.dto';
import { MemberReservationEntity } from './entities/member-reservation.entity';
import { AuthGuard } from '../guards/auth.guard';
import { ManagerAuthGuard } from '../guards/manager-auth.guard';
import { Roles } from '../decorators/roles/Role';
import { Permissions } from '../decorators/roles/role.enum';

@ApiTags('Member Reservations')
@Controller('member-reservations')
export class MemberReservationController {
  constructor(
    private readonly memberReservationService: MemberReservationService,
  ) {}

  @Post('available-slots/:dayOfWeek')
  @ApiOperation({ summary: 'Get available time slots for a specific date' })
  @ApiOkResponse({
    description: 'Available time slots retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          startTime: { type: 'string' },
          endTime: { type: 'string' },
          isAvailable: { type: 'boolean' },
          currentReservations: { type: 'number' },
          maxReservations: { type: 'number' },
        },
      },
    },
  })
  @UseGuards(AuthGuard)
  async getAvailableSlots(
    @Param('dayOfWeek') dayOfWeek: string,
    @Body() getAvailableSlotsDto: GetAvailableSlotsDto,
  ): Promise<TimeSlot[]> {
    return this.memberReservationService.getAvailableSlots(
      dayOfWeek,
      getAvailableSlotsDto,
    );
  }

  @Post()
  @ApiOperation({ summary: 'Create a new reservation' })
  @ApiOkResponse({
    description: 'Reservation created successfully',
    type: MemberReservationEntity,
  })
  @UseGuards(AuthGuard)
  async createReservation(
    @Request() req: any,
    @Body() createReservationDto: CreateReservationDto,
  ): Promise<MemberReservationEntity> {
    const memberId = req.user.id;
    return this.memberReservationService.createReservation(
      memberId,
      createReservationDto,
    );
  }

  @Get('my-reservations')
  @ApiOperation({ summary: 'Get current member reservations' })
  @ApiOkResponse({
    description: 'Member reservations retrieved successfully',
    type: [MemberReservationEntity],
  })
  @UseGuards(AuthGuard)
  async getMyReservations(
    @Request() req: any,
    @Param('gymId') gymId?: string,
  ): Promise<MemberReservationEntity[]> {
    const memberId = req.user.id;
    return this.memberReservationService.getMemberReservations(memberId, gymId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Cancel a reservation' })
  @ApiOkResponse({
    description: 'Reservation cancelled successfully',
  })
  @UseGuards(AuthGuard)
  async cancelReservation(
    @Request() req: any,
    @Param('id') reservationId: string,
  ): Promise<{ message: string }> {
    const memberId = req.user.id;
    await this.memberReservationService.cancelReservation(
      memberId,
      reservationId,
    );
    return { message: 'Reservation cancelled successfully' };
  }

  @Get('gym-reservations/get/:gymId')
  @Roles(Permissions.GymOwner, Permissions.members)
  @UseGuards(ManagerAuthGuard)
  @ApiOperation({ summary: 'Get all reservations for a gym' })
  async getGymReservations(
    @Param('gymId') gymId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.memberReservationService.getGymReservations(
      gymId,
      startDate,
      endDate,
    );
  }
}
