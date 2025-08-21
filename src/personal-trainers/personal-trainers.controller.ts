import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
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
import { PersonalTrainer } from './entities/personal-trainer.entity';
import { PersonalTrainersService } from './personal-trainers.service';

@Controller('personal-trainers')
export class PersonalTrainersController {
  constructor(
    private readonly personalTrainersService: PersonalTrainersService,
  ) {}

  @Post()
  @UseGuards(ManagerAuthGuard)
  @Roles(Permissions.SuperAdmin)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new personal trainer' })
  @ApiBody({ type: CreatePersonalTrainerDto })
  @ApiResponse({
    status: 201,
    description: 'The personal trainer has been successfully created.',
    type: PersonalTrainer,
  })
  create(@Body() createPersonalTrainerDto: CreatePersonalTrainerDto) {
    return this.personalTrainersService.create(createPersonalTrainerDto);
  }

  @Get()
  @UseGuards(ManagerAuthGuard)
  @Roles(Permissions.SuperAdmin)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all personal trainers' })
  @ApiResponse({
    status: 200,
    description: 'The personal trainers have been successfully retrieved.',
    type: [PersonalTrainer],
  })
  findAll() {
    return this.personalTrainersService.findAll();
  }

  @Get(':id')
  @UseGuards(ManagerAuthGuard)
  @Roles(Permissions.SuperAdmin)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a personal trainer by ID' })
  @ApiResponse({
    status: 200,
    description: 'The personal trainer has been successfully retrieved.',
    type: PersonalTrainer,
  })
  findOne(@Param('id') id: string) {
    return this.personalTrainersService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(ManagerAuthGuard)
  @Roles(Permissions.SuperAdmin)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a personal trainer by ID' })
  @ApiResponse({
    status: 200,
    description: 'The personal trainer has been successfully updated.',
    type: PersonalTrainer,
  })
  update(
    @Param('id') id: string,
    @Body() updatePersonalTrainerDto: UpdatePersonalTrainerDto,
  ) {
    return this.personalTrainersService.update(id, updatePersonalTrainerDto);
  }

  @Delete(':id')
  @UseGuards(ManagerAuthGuard)
  @Roles(Permissions.SuperAdmin)
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
  @Roles(Permissions.SuperAdmin)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all users' })
  @ApiResponse({
    status: 200,
    description: 'The users have been successfully retrieved.',
    type: [User],
  })
  findAllUsers(@User() personalTrainer: PersonalTrainer) {
    return this.personalTrainersService.findAllUsers(personalTrainer);
  }

  @Post('add-user')
  @UseGuards(ManagerAuthGuard)
  @Roles(Permissions.SuperAdmin)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add a user to a personal trainer' })
  @ApiResponse({
    status: 200,
    description:
      'The user has been successfully added to the personal trainer.',
  })
  addUserToPersonalTrainer(
    @Body() addUserToPersonalTrainerDto: AddPersonalTrainerDto,
    @User() personalTrainer: PersonalTrainer,
  ) {
    return this.personalTrainersService.addUserToPersonalTrainer(
      addUserToPersonalTrainerDto,
      personalTrainer,
    );
  }
}
