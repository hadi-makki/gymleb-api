import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
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
import { Manager } from 'src/manager/manager.model';

@Controller('personal-trainers')
export class PersonalTrainersController {
  constructor(
    private readonly personalTrainersService: PersonalTrainersService,
  ) {}

  @Post(':gymId')
  @UseGuards(ManagerAuthGuard)
  @Roles(Permissions.GymOwner)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new personal trainer' })
  @ApiBody({ type: CreatePersonalTrainerDto })
  @ApiResponse({
    status: 201,
    description: 'The personal trainer has been successfully created.',
    type: Manager,
  })
  create(
    @Param('gymId') gymId: string,
    @Body() createPersonalTrainerDto: CreatePersonalTrainerDto,
  ) {
    return this.personalTrainersService.create(createPersonalTrainerDto, gymId);
  }

  @Get()
  @UseGuards(ManagerAuthGuard)
  @Roles(Permissions.GymOwner, Permissions.SuperAdmin)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all personal trainers' })
  @ApiResponse({
    status: 200,
    description: 'The personal trainers have been successfully retrieved.',
    type: [Manager],
  })
  findAll() {
    return this.personalTrainersService.findAll();
  }

  @Get('gym/:gymId')
  @UseGuards(ManagerAuthGuard)
  @Roles(Permissions.GymOwner, Permissions.SuperAdmin)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all personal trainers for a specific gym' })
  @ApiResponse({
    status: 200,
    description: 'The personal trainers have been successfully retrieved.',
    type: [Manager],
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
    type: Manager,
  })
  findOne(@Param('id') id: string) {
    return this.personalTrainersService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(ManagerAuthGuard)
  @Roles(Permissions.GymOwner, Permissions.SuperAdmin)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a personal trainer by ID' })
  @ApiResponse({
    status: 200,
    description: 'The personal trainer has been successfully updated.',
    type: Manager,
  })
  update(
    @Param('id') id: string,
    @Body() updatePersonalTrainerDto: UpdatePersonalTrainerDto,
  ) {
    return this.personalTrainersService.update(id, updatePersonalTrainerDto);
  }

  @Delete(':id')
  @UseGuards(ManagerAuthGuard)
  @Roles(Permissions.GymOwner, Permissions.SuperAdmin)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a personal trainer by ID' })
  @ApiResponse({
    status: 200,
    description: 'The personal trainer has been successfully deleted.',
  })
  remove(@Param('id') id: string) {
    return this.personalTrainersService.remove(id);
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
  findAllUsers(@User() personalTrainer: Manager) {
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
    @User() personalTrainer: Manager,
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
  ) {
    return await this.personalTrainersService.createSession(
      gymId,
      createSessionDto,
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
    @User() personalTrainer: Manager,
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
  ) {
    return this.personalTrainersService.updateSession(
      sessionId,
      updateSessionDto,
    );
  }

  @Get('trainer/:trainerId/sessions/:gymId')
  @UseGuards(ManagerAuthGuard)
  @Roles(Permissions.GymOwner, Permissions.SuperAdmin)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all sessions for a specific trainer' })
  @ApiResponse({
    status: 200,
    description: 'The sessions have been successfully retrieved.',
  })
  getTrainerSessions(
    @Param('trainerId') trainerId: string,
    @Param('gymId') gymId: string,
  ) {
    return this.personalTrainersService.getTrainerSessions(trainerId, gymId);
  }

  @Get('trainer/:trainerId/clients/:gymId')
  @UseGuards(ManagerAuthGuard)
  @Roles(Permissions.GymOwner, Permissions.SuperAdmin)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all clients for a specific trainer' })
  @ApiResponse({
    status: 200,
    description: 'The clients have been successfully retrieved.',
  })
  getTrainerClients(
    @Param('trainerId') trainerId: string,
    @Param('gymId') gymId: string,
  ) {
    return this.personalTrainersService.getTrainerClients(trainerId, gymId);
  }

  @Get('trainer/:trainerId/client/:memberId/sessions/:gymId')
  @UseGuards(ManagerAuthGuard)
  @Roles(Permissions.GymOwner, Permissions.SuperAdmin)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get all sessions for a specific client of a specific trainer',
  })
  @ApiResponse({
    status: 200,
    description: 'The sessions have been successfully retrieved.',
  })
  getTrainerClientSessions(
    @Param('trainerId') trainerId: string,
    @Param('memberId') memberId: string,
    @Param('gymId') gymId: string,
  ) {
    return this.personalTrainersService.getTrainerClientSessions(
      trainerId,
      memberId,
      gymId,
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
    @User() personalTrainer: Manager,
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
    @User() personalTrainer: Manager,
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
    @User() personalTrainer: Manager,
  ) {
    return await this.personalTrainersService.getClientSessions(
      memberId,
      gymId,
      personalTrainer,
    );
  }
}
