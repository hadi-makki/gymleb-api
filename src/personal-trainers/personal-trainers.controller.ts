import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  Query,
  UseInterceptors,
  Headers,
  Res,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { MaxFileSizeValidator, ParseFilePipe } from '@nestjs/common';
import { Roles } from '../decorators/roles/Role';
import { Permissions } from '../decorators/roles/role.enum';
import { User } from '../decorators/users.decorator';
import { ManagerAuthGuard } from '../guards/manager-auth.guard';
import { AddPersonalTrainerDto } from './dto/add-personal-trainer.dto';
import { CreatePersonalTrainerDto } from './dto/create-personal-trainer.dto';
import { UpdatePersonalTrainerDto } from './dto/update-personal-trainer.dto';

import { PersonalTrainersService } from './personal-trainers.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { UpdateSessionDto } from './dto/update-session.dto';
import { BulkUpdateSessionDatesDto } from './dto/bulk-update-session-dates.dto';
import { ManagerEntity } from 'src/manager/manager.entity';
import { ValidateGymRelatedToOwner } from 'src/decorators/validate-gym-related-to-owner.decorator';
import { ValidatePersonalTrainerRelatedToGym } from 'src/decorators/validate-personal-trainer-related-to-gym.decorator';
import { Response } from 'express';

@Controller('personal-trainers')
export class PersonalTrainersController {
  constructor(
    private readonly personalTrainersService: PersonalTrainersService,
  ) {}

  @Post(':gymId')
  @UseGuards(ManagerAuthGuard)
  @Roles(Permissions.GymOwner)
  @ValidateGymRelatedToOwner()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new personal trainer' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: CreatePersonalTrainerDto })
  @ApiResponse({
    status: 201,
    description: 'The personal trainer has been successfully created.',
    type: ManagerEntity,
  })
  @UseInterceptors(FileInterceptor('profileImage'))
  create(
    @Param('gymId') gymId: string,
    @Body() createPersonalTrainerDto: CreatePersonalTrainerDto,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }), // 5MB
        ],
        fileIsRequired: false,
      }),
    )
    profileImage?: Express.Multer.File,
  ) {
    return this.personalTrainersService.create(
      createPersonalTrainerDto,
      gymId,
      profileImage,
    );
  }

  @Get()
  @UseGuards(ManagerAuthGuard)
  @Roles(Permissions.GymOwner, Permissions.SuperAdmin)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all personal trainers' })
  @ApiResponse({
    status: 200,
    description: 'The personal trainers have been successfully retrieved.',
    type: [ManagerEntity],
  })
  findAll() {
    return this.personalTrainersService.findAll();
  }

  @Get('gym/:gymId')
  @UseGuards(ManagerAuthGuard)
  @Roles(Permissions.GymOwner, Permissions.SuperAdmin)
  @ValidateGymRelatedToOwner()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all personal trainers for a specific gym' })
  @ApiResponse({
    status: 200,
    description: 'The personal trainers have been successfully retrieved.',
    type: [ManagerEntity],
  })
  findByGym(@Param('gymId') gymId: string) {
    return this.personalTrainersService.findByGym(gymId);
  }

  @Get('gym/:gymId/members')
  @UseGuards(ManagerAuthGuard)
  @Roles(
    Permissions.GymOwner,
    Permissions.SuperAdmin,
    Permissions.personalTrainers,
  )
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all members for a specific gym' })
  @ApiResponse({
    status: 200,
    description: 'The members have been successfully retrieved.',
  })
  getGymMembers(
    @Param('gymId') gymId: string,
    @Query('search') search?: string,
    @Query('limit') limit?: string,
  ) {
    return this.personalTrainersService.getGymMembers(
      gymId,
      search,
      limit ? parseInt(limit) : undefined,
    );
  }

  @Get(':id')
  @UseGuards(ManagerAuthGuard)
  @Roles(Permissions.GymOwner, Permissions.SuperAdmin)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a personal trainer by ID' })
  @ApiResponse({
    status: 200,
    description: 'The personal trainer has been successfully retrieved.',
    type: ManagerEntity,
  })
  findOne(@Param('id') id: string) {
    return this.personalTrainersService.findOne(id);
  }

  @Patch('/update/personal-trainer/:gymId/:personalTrainerId')
  @UseGuards(ManagerAuthGuard)
  @Roles(Permissions.GymOwner, Permissions.SuperAdmin)
  @ValidateGymRelatedToOwner()
  @ValidatePersonalTrainerRelatedToGym()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a personal trainer by ID' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({
    status: 200,
    description: 'The personal trainer has been successfully updated.',
    type: ManagerEntity,
  })
  @UseInterceptors(FileInterceptor('profileImage'))
  update(
    @Param('gymId') gymId: string,
    @Param('personalTrainerId') personalTrainerId: string,
    @Body() updatePersonalTrainerDto: UpdatePersonalTrainerDto,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }), // 5MB
        ],
        fileIsRequired: false,
      }),
    )
    profileImage?: Express.Multer.File,
  ) {
    return this.personalTrainersService.update(
      personalTrainerId,
      updatePersonalTrainerDto,
      profileImage,
    );
  }

  @Delete(':gymId/:personalTrainerId')
  @UseGuards(ManagerAuthGuard)
  @Roles(Permissions.GymOwner, Permissions.SuperAdmin)
  @ValidateGymRelatedToOwner()
  @ValidatePersonalTrainerRelatedToGym()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a personal trainer by ID' })
  @ApiResponse({
    status: 200,
    description: 'The personal trainer has been successfully deleted.',
  })
  remove(
    @Param('gymId') gymId: string,
    @Param('personalTrainerId') personalTrainerId: string,
  ) {
    return this.personalTrainersService.remove(personalTrainerId);
  }

  @Patch(':gymId/:personalTrainerId/read-only')
  @UseGuards(ManagerAuthGuard)
  @Roles(Permissions.GymOwner, Permissions.SuperAdmin)
  @ValidateGymRelatedToOwner()
  @ValidatePersonalTrainerRelatedToGym()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Toggle personal trainer read-only status' })
  @ApiResponse({
    status: 200,
    description: 'The personal trainer read-only status has been updated.',
  })
  toggleReadOnly(
    @Param('gymId') gymId: string,
    @Param('personalTrainerId') personalTrainerId: string,
    @Body() body: { isReadOnly: boolean },
  ) {
    return this.personalTrainersService.toggleReadOnlyPersonalTrainer(
      personalTrainerId,
      body.isReadOnly,
    );
  }

  @Get('users')
  @UseGuards(ManagerAuthGuard)
  @Roles(Permissions.GymOwner, Permissions.SuperAdmin)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all users' })
  @ApiResponse({
    status: 200,
    description: 'The users have been successfully retrieved.',
    type: [User],
  })
  findAllUsers(@User() personalTrainer: ManagerEntity) {
    return this.personalTrainersService.findAllUsers(personalTrainer);
  }

  @Post('add-user')
  @UseGuards(ManagerAuthGuard)
  @Roles(Permissions.GymOwner, Permissions.SuperAdmin)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add a user to a personal trainer' })
  @ApiResponse({
    status: 200,
    description:
      'The user has been successfully added to the personal trainer.',
  })
  addUserToPersonalTrainer(
    @Body() addUserToPersonalTrainerDto: AddPersonalTrainerDto,
    @User() personalTrainer: ManagerEntity,
  ) {
    return this.personalTrainersService.addUserToPersonalTrainer(
      addUserToPersonalTrainerDto,
      personalTrainer,
    );
  }

  @Post('create-session/:gymId')
  @UseGuards(ManagerAuthGuard)
  @Roles(
    Permissions.GymOwner,
    Permissions.SuperAdmin,
    Permissions.personalTrainers,
  )
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new session' })
  @ApiResponse({
    status: 200,
    description: 'The session has been successfully created.',
  })
  async createSession(
    @Param('gymId') gymId: string,
    @Body() createSessionDto: CreateSessionDto,
    @Headers('timezone') timezone?: string,
  ) {
    return await this.personalTrainersService.createSession(
      gymId,
      createSessionDto,
      timezone,
    );
  }

  @Get('sessions/:gymId')
  @UseGuards(ManagerAuthGuard)
  @Roles(
    Permissions.GymOwner,
    Permissions.SuperAdmin,
    Permissions.personalTrainers,
  )
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all sessions for the current trainer' })
  @ApiResponse({
    status: 200,
    description: 'The sessions have been successfully retrieved.',
  })
  findAllSessions(
    @Param('gymId') gymId: string,
    @User() personalTrainer: ManagerEntity,
  ) {
    return this.personalTrainersService.findAllSessions(gymId, personalTrainer);
  }

  @Patch('sessions/:sessionId/cancel')
  @UseGuards(ManagerAuthGuard)
  @Roles(
    Permissions.GymOwner,
    Permissions.SuperAdmin,
    Permissions.personalTrainers,
  )
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cancel a session' })
  @ApiResponse({
    status: 200,
    description: 'The session has been successfully cancelled.',
  })
  cancelSession(
    @Param('sessionId') sessionId: string,
    @Body() body: { reason: string },
  ) {
    return this.personalTrainersService.cancelSession(sessionId, body.reason);
  }

  @Patch('sessions/:sessionId')
  @UseGuards(ManagerAuthGuard)
  @Roles(
    Permissions.GymOwner,
    Permissions.SuperAdmin,
    Permissions.personalTrainers,
  )
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a session' })
  @ApiBody({ type: UpdateSessionDto })
  @ApiResponse({
    status: 200,
    description: 'The session has been successfully updated.',
  })
  updateSession(
    @Param('sessionId') sessionId: string,
    @Body() updateSessionDto: UpdateSessionDto,
    @Headers('timezone') timezone?: string,
  ) {
    return this.personalTrainersService.updateSession(
      sessionId,
      updateSessionDto,
      timezone,
    );
  }

  @Post('sessions/bulk-update-dates')
  @UseGuards(ManagerAuthGuard)
  @Roles(
    Permissions.GymOwner,
    Permissions.SuperAdmin,
    Permissions.personalTrainers,
  )
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Bulk update PT session dates weekly by weekday+time',
  })
  @ApiBody({ type: BulkUpdateSessionDatesDto })
  @ApiResponse({
    status: 200,
    description: 'The sessions dates have been successfully updated.',
  })
  bulkUpdateSessionDates(
    @Body() dto: BulkUpdateSessionDatesDto,
    @Headers('timezone') timezone?: string,
  ) {
    return this.personalTrainersService.bulkUpdateSessionDates(dto, timezone);
  }

  @Delete('sessions/:sessionId/:gymId')
  @UseGuards(ManagerAuthGuard)
  @Roles(
    Permissions.GymOwner,
    Permissions.SuperAdmin,
    Permissions.personalTrainers,
  )
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a session' })
  @ApiResponse({
    status: 200,
    description: 'The session has been successfully deleted.',
  })
  deleteSession(@Param('sessionId') sessionId: string) {
    return this.personalTrainersService.deleteSession(sessionId);
  }

  @Get('trainer/:gymId/:personalTrainerId/sessions')
  @UseGuards(ManagerAuthGuard)
  @Roles(Permissions.GymOwner, Permissions.SuperAdmin)
  @ValidateGymRelatedToOwner()
  @ValidatePersonalTrainerRelatedToGym()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all sessions for a specific trainer' })
  @ApiResponse({
    status: 200,
    description: 'The sessions have been successfully retrieved.',
  })
  getTrainerSessions(
    @Param('gymId') gymId: string,
    @Param('personalTrainerId') personalTrainerId: string,
    @Headers('timezone') timezone?: string,
  ) {
    return this.personalTrainersService.getTrainerSessions(
      personalTrainerId,
      gymId,
      timezone,
    );
  }

  @Get('export/:gymId/:personalTrainerId')
  @UseGuards(ManagerAuthGuard)
  @Roles(Permissions.GymOwner, Permissions.SuperAdmin)
  @ValidateGymRelatedToOwner()
  @ValidatePersonalTrainerRelatedToGym()
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Export all sessions for a specific trainer as Excel',
  })
  async exportTrainerSessions(
    @Param('gymId') gymId: string,
    @Param('personalTrainerId') personalTrainerId: string,
    @Res() res: Response,
    @Query('statuses') statuses?: string,
    @Query('everything') everything?: string,
  ) {
    const options = {
      statuses: (statuses || '')
        .split(',')
        .map((s) => s.trim())
        .filter((s) => !!s),
      everything: everything === 'true',
    } as { statuses: string[]; everything: boolean };

    const { buffer, filename } =
      await this.personalTrainersService.exportTrainerSessionsXlsx(
        gymId,
        personalTrainerId,
        options,
      );
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.end(buffer);
  }

  @Get('export/:gymId/:personalTrainerId/member/:memberId')
  @UseGuards(ManagerAuthGuard)
  @Roles(Permissions.GymOwner, Permissions.SuperAdmin)
  @ValidateGymRelatedToOwner()
  @ValidatePersonalTrainerRelatedToGym()
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Export sessions for a specific member of a trainer as Excel',
  })
  async exportTrainerMemberSessions(
    @Param('gymId') gymId: string,
    @Param('personalTrainerId') personalTrainerId: string,
    @Param('memberId') memberId: string,
    @Res() res: Response,
    @Query('statuses') statuses?: string,
    @Query('everything') everything?: string,
  ) {
    const options = {
      statuses: (statuses || '')
        .split(',')
        .map((s) => s.trim())
        .filter((s) => !!s),
      everything: everything === 'true',
    } as { statuses: string[]; everything: boolean };

    const { buffer, filename } =
      await this.personalTrainersService.exportTrainerMemberSessionsXlsx(
        gymId,
        personalTrainerId,
        memberId,
        options,
      );
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.end(buffer);
  }

  @Get('trainer/:gymId/:personalTrainerId/clients')
  @UseGuards(ManagerAuthGuard)
  @Roles(Permissions.GymOwner, Permissions.SuperAdmin)
  @ValidateGymRelatedToOwner()
  @ValidatePersonalTrainerRelatedToGym()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all clients for a specific trainer' })
  @ApiResponse({
    status: 200,
    description: 'The clients have been successfully retrieved.',
  })
  getTrainerClients(
    @Param('gymId') gymId: string,
    @Param('personalTrainerId') personalTrainerId: string,
  ) {
    return this.personalTrainersService.getTrainerClients(
      personalTrainerId,
      gymId,
    );
  }

  @Get('trainer/:gymId/:personalTrainerId/client/:memberId/sessions')
  @UseGuards(ManagerAuthGuard)
  @Roles(Permissions.GymOwner, Permissions.SuperAdmin)
  @ValidateGymRelatedToOwner()
  @ValidatePersonalTrainerRelatedToGym()
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get all sessions for a specific client of a specific trainer',
  })
  @ApiResponse({
    status: 200,
    description: 'The sessions have been successfully retrieved.',
  })
  getTrainerClientSessions(
    @Param('gymId') gymId: string,
    @Param('personalTrainerId') personalTrainerId: string,
    @Param('memberId') memberId: string,
    @Query('status') status?: 'active' | 'inactive',
    @Headers('timezone') timezone?: string,
  ) {
    return this.personalTrainersService.getTrainerClientSessions(
      personalTrainerId,
      memberId,
      gymId,
      status,
      timezone,
    );
  }

  @Get('debug/trainer/:gymId/:personalTrainerId/client/:memberId/sessions')
  @UseGuards(ManagerAuthGuard)
  @Roles(Permissions.GymOwner, Permissions.SuperAdmin)
  @ValidateGymRelatedToOwner()
  @ValidatePersonalTrainerRelatedToGym()
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'Debug sessions for a specific client with timezone comparison data',
  })
  @ApiResponse({
    status: 200,
    description: 'Debug session data with timezone comparisons.',
  })
  debugGetTrainerClientSessions(
    @Param('gymId') gymId: string,
    @Param('personalTrainerId') personalTrainerId: string,
    @Param('memberId') memberId: string,
    @Headers('timezone') timezone?: string,
  ) {
    return this.personalTrainersService.debugGetTrainerClientSessions(
      personalTrainerId,
      gymId,
      memberId,
      timezone,
    );
  }

  @Get('trainer/:gymId/:personalTrainerId/group-sessions')
  @UseGuards(ManagerAuthGuard)
  @Roles(Permissions.GymOwner, Permissions.SuperAdmin)
  @ValidateGymRelatedToOwner()
  @ValidatePersonalTrainerRelatedToGym()
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get sessions for a client group (same session members)',
  })
  @ApiResponse({
    status: 200,
    description: 'The sessions have been successfully retrieved.',
  })
  getTrainerGroupSessions(
    @Param('gymId') gymId: string,
    @Param('personalTrainerId') personalTrainerId: string,
    @Query('memberIds') memberIds: string,
    @Query('status') status?: 'active' | 'inactive',
    @Headers('timezone') timezone?: string,
  ) {
    const ids = (memberIds || '')
      .split(',')
      .map((s) => s.trim())
      .filter((s) => !!s);
    return this.personalTrainersService.getTrainerGroupSessions(
      personalTrainerId,
      gymId,
      ids,
      status,
      timezone,
    );
  }

  @Get('my-sessions/:gymId')
  @UseGuards(ManagerAuthGuard)
  @Roles(
    Permissions.GymOwner,
    Permissions.SuperAdmin,
    Permissions.personalTrainers,
  )
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get all sessions for the current personal trainer',
  })
  @ApiResponse({
    status: 200,
    description: 'The sessions have been successfully retrieved.',
  })
  async mySessions(
    @Param('gymId') gymId: string,
    @User() personalTrainer: ManagerEntity,
  ) {
    return await this.personalTrainersService.mySessions(
      gymId,
      personalTrainer,
    );
  }

  @Get('my-clients/:gymId')
  @UseGuards(ManagerAuthGuard)
  @Roles(
    Permissions.GymOwner,
    Permissions.SuperAdmin,
    Permissions.personalTrainers,
  )
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'Get all clients (users) who have sessions with the current trainer',
  })
  @ApiResponse({
    status: 200,
    description: 'The clients have been successfully retrieved.',
  })
  async myClients(
    @Param('gymId') gymId: string,
    @User() personalTrainer: ManagerEntity,
  ) {
    return await this.personalTrainersService.myClients(gymId, personalTrainer);
  }

  @Get('client/:memberId/sessions/:gymId')
  @UseGuards(ManagerAuthGuard)
  @Roles(
    Permissions.GymOwner,
    Permissions.SuperAdmin,
    Permissions.personalTrainers,
  )
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get all sessions for a specific client with the current trainer',
  })
  @ApiResponse({
    status: 200,
    description: 'The sessions have been successfully retrieved.',
  })
  async getClientSessions(
    @Param('memberId') memberId: string,
    @Param('gymId') gymId: string,
    @User() personalTrainer: ManagerEntity,
    @Headers('timezone') timezone?: string,
  ) {
    return await this.personalTrainersService.getClientSessions(
      memberId,
      gymId,
      personalTrainer,
      timezone,
    );
  }

  @Get('calendar-sessions/:gymId')
  @UseGuards(ManagerAuthGuard)
  @Roles(Permissions.GymOwner, Permissions.personalTrainers)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get all PT sessions for calendar view',
    description: 'Get all PT sessions for a gym with calendar-specific data',
  })
  @ApiResponse({
    status: 200,
    description:
      'The PT sessions have been successfully retrieved for calendar view.',
  })
  async getCalendarSessions(
    @Param('gymId') gymId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Headers('timezone') timezone?: string,
  ) {
    return await this.personalTrainersService.getCalendarSessions(
      gymId,
      startDate,
      endDate,
      timezone,
    );
  }

  @Get('sessions-by-date/:gymId')
  @UseGuards(ManagerAuthGuard)
  @Roles(
    Permissions.GymOwner,
    Permissions.SuperAdmin,
    Permissions.personalTrainers,
  )
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get PT sessions filtered by date',
    description:
      'Get all PT sessions for a specific date with filtering options',
  })
  @ApiResponse({
    status: 200,
    description: 'The PT sessions have been successfully retrieved by date.',
  })
  async getSessionsByDate(
    @Param('gymId') gymId: string,
    @Query('date') date: string,
    @Query('filterBy') filterBy: 'time' | 'owner' = 'time',
    @Query('trainerId') trainerId: string,
    @Headers('timezone') timezone?: string,
  ) {
    return await this.personalTrainersService.getSessionsByDate(
      gymId,
      date,
      filterBy,
      trainerId,
      timezone,
    );
  }

  @Get('all-sessions-by-date/:gymId')
  @UseGuards(ManagerAuthGuard)
  @Roles(Permissions.SuperAdmin)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get all PT sessions across all gyms by date (Super Admin only)',
    description:
      'Get all PT sessions for all gyms on a specific date with filtering options',
  })
  @ApiResponse({
    status: 200,
    description: 'All PT sessions have been successfully retrieved by date.',
  })
  async getAllSessionsByDate(
    @Query('date') date: string,
    @Query('filterBy') filterBy: 'time' | 'owner' = 'time',
    @Query('trainerId') trainerId: string,
    @Headers('timezone') timezone?: string,
  ) {
    return await this.personalTrainersService.getAllSessionsByDate(
      date,
      filterBy,
      trainerId,
      timezone,
    );
  }

  @Get('my-sessions-by-date/:gymId')
  @UseGuards(ManagerAuthGuard)
  @Roles(Permissions.personalTrainers)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get my PT sessions by date',
    description:
      'Get PT sessions for the current trainer on a specific date with filtering options',
  })
  @ApiResponse({
    status: 200,
    description: 'My PT sessions have been successfully retrieved by date.',
  })
  async getMySessionsByDate(
    @User() user: ManagerEntity,
    @Param('gymId') gymId: string,
    @Query('date') date: string,
    @Query('filterBy') filterBy: 'time' | 'owner' = 'time',
    @Headers('timezone') timezone?: string,
  ) {
    return await this.personalTrainersService.getMySessionsByDate(
      user.id,
      gymId,
      date,
      filterBy,
      timezone,
    );
  }

  @Get('availability/:ptId')
  @ApiOperation({ summary: 'Get PT availability information' })
  @ApiResponse({
    status: 200,
    description: 'PT availability information retrieved successfully',
  })
  async getPtAvailability(@Param('ptId') ptId: string) {
    return await this.personalTrainersService.getPtAvailability(ptId);
  }
}
