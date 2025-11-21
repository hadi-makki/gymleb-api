import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  Headers,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { PersonalScheduleService } from './personal-schedule.service';
import { CreatePersonalScheduleDto } from './dto/create-personal-schedule.dto';
import { UpdatePersonalScheduleDto } from './dto/update-personal-schedule.dto';
import { ManagerAuthGuard } from '../guards/manager-auth.guard';
import { Roles } from '../decorators/roles/Role';
import { Permissions } from '../decorators/roles/role.enum';
import { User } from '../decorators/users.decorator';
import { ManagerEntity } from '../manager/manager.entity';
import { MemberEntity } from '../member/entities/member.entity';

@Controller('personal-schedule')
@ApiTags('Personal Schedule')
@UseGuards(ManagerAuthGuard)
@Roles(Permissions.Any)
@ApiBearerAuth()
export class PersonalScheduleController {
  constructor(
    private readonly personalScheduleService: PersonalScheduleService,
  ) {}

  @Post()
  @ApiOperation({
    summary: 'Create a personal schedule event',
    description:
      'Create a new personal schedule event for the authenticated user',
  })
  @ApiResponse({
    status: 201,
    description: 'The personal schedule has been successfully created.',
  })
  create(
    @Body() createPersonalScheduleDto: CreatePersonalScheduleDto,
    @User() user: ManagerEntity,
  ) {
    return this.personalScheduleService.create(createPersonalScheduleDto, user);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all personal schedules',
    description:
      'Get all personal schedules for a gym. Gym owners can see all schedules when showAll=true',
  })
  @ApiResponse({
    status: 200,
    description: 'The personal schedules have been successfully retrieved.',
  })
  findAll(
    @Query('gymId') gymId: string,
    @Query('showAll') showAll?: string,
    @User() user?: ManagerEntity,
  ) {
    const userId = user?.id;
    const userType: 'member' | 'manager' = 'manager';
    const shouldShowAll = showAll === 'true';
    return this.personalScheduleService.findAll(
      gymId,
      userId,
      userType,
      shouldShowAll,
    );
  }

  @Get('calendar/:gymId')
  @ApiOperation({
    summary: 'Get personal schedules for calendar view',
    description:
      'Get personal schedules for a gym with calendar-specific data. Gym owners can see all schedules when showAll=true',
  })
  @ApiResponse({
    status: 200,
    description:
      'The personal schedules have been successfully retrieved for calendar view.',
  })
  async getCalendarSchedules(
    @Param('gymId') gymId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('showAll') showAll?: string,
    @Headers('timezone') timezone?: string,
    @User() user?: ManagerEntity,
  ) {
    const userId = user?.id;
    const userType: 'member' | 'manager' = 'manager';
    const shouldShowAll = showAll === 'true';
    return await this.personalScheduleService.getCalendarSchedules(
      gymId,
      startDate,
      endDate,
      userId,
      userType,
      shouldShowAll,
      timezone,
    );
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get a personal schedule by ID',
    description: 'Get a single personal schedule event by its ID',
  })
  @ApiResponse({
    status: 200,
    description: 'The personal schedule has been successfully retrieved.',
  })
  findOne(@Param('id') id: string, @User() user?: ManagerEntity) {
    const userId = user?.id;
    const userType: 'member' | 'manager' = 'manager';
    return this.personalScheduleService.findOne(id, userId, userType);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update a personal schedule',
    description: 'Update a personal schedule event. Only the owner can update.',
  })
  @ApiResponse({
    status: 200,
    description: 'The personal schedule has been successfully updated.',
  })
  update(
    @Param('id') id: string,
    @Body() updatePersonalScheduleDto: UpdatePersonalScheduleDto,
    @User() user: ManagerEntity,
  ) {
    const userId = user.id;
    const userType: 'member' | 'manager' = 'manager';
    return this.personalScheduleService.update(
      id,
      updatePersonalScheduleDto,
      userId,
      userType,
    );
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete a personal schedule',
    description: 'Delete a personal schedule event. Only the owner can delete.',
  })
  @ApiResponse({
    status: 200,
    description: 'The personal schedule has been successfully deleted.',
  })
  remove(@Param('id') id: string, @User() user: ManagerEntity) {
    const userId = user.id;
    const userType: 'member' | 'manager' = 'manager';
    return this.personalScheduleService.remove(id, userId, userType);
  }
}
