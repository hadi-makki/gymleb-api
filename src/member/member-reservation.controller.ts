import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
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

@ApiTags('Member Reservations')
@Controller('member-reservations')
@UseGuards(AuthGuard)
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
}
