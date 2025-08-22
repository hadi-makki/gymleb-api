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
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Gym } from 'src/gym/entities/gym.entity';
import { Roles } from '../decorators/roles/Role';
import { Permissions } from '../decorators/roles/role.enum';
import { User } from '../decorators/users.decorator';
import { returnManager } from '../functions/returnUser';
import { ManagerAuthGuard } from '../guards/manager-auth.guard';
import { Manager } from '../manager/manager.entity';
import { CreateGymOwnerDto } from './dto/create-gym-owner.dto';
import { CreateGymToGymOwnerDto } from './dto/create-gym-to-gym-owner.dto';
import { UpdateGymOwnerDto } from './dto/update-gym-owner.dto';
import { GymOwnerService } from './gym-owner.service';
@Controller('gym-owner')
@ApiTags('Gym Owner')
export class GymOwnerController {
  constructor(private readonly gymOwnerService: GymOwnerService) {}

  @Post()
  @UseGuards(ManagerAuthGuard)
  @ApiOperation({ summary: 'Create a gym owner' })
  @ApiOkResponse({
    description: 'The gym owner has been successfully created.',
    type: Manager,
  })
  @Roles(Permissions.SuperAdmin)
  async create(
    @Body() createGymOwnerDto: CreateGymOwnerDto,
    @User() user: Manager,
  ) {
    return await this.gymOwnerService.create(createGymOwnerDto, user);
  }

  @Get()
  @UseGuards(ManagerAuthGuard)
  @ApiOperation({ summary: 'Get all gym owners' })
  @ApiOkResponse({
    description: 'The gym owners have been successfully retrieved.',
    type: [Manager],
  })
  @Roles(Permissions.GymOwner)
  findAll() {
    return this.gymOwnerService.findAll();
  }

  @Get(':id')
  @UseGuards(ManagerAuthGuard)
  @ApiOperation({ summary: 'Get a gym owner by id' })
  @ApiOkResponse({
    description: 'The gym owner has been successfully retrieved.',
    type: Manager,
  })
  @Roles(Permissions.GymOwner)
  findOne(@Param('id') id: string) {
    return this.gymOwnerService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(ManagerAuthGuard)
  @ApiOperation({ summary: 'Update a gym owner by id' })
  @ApiOkResponse({
    description: 'The gym owner has been successfully updated.',
    type: Manager,
  })
  @Roles(Permissions.GymOwner)
  update(
    @Param('id') id: string,
    @Body() updateGymOwnerDto: UpdateGymOwnerDto,
  ) {
    return this.gymOwnerService.update(id, updateGymOwnerDto);
  }

  @Delete(':id')
  @UseGuards(ManagerAuthGuard)
  @ApiOperation({ summary: 'Delete a gym owner by id' })
  @ApiOkResponse({
    description: 'The gym owner has been successfully deleted.',
    type: Manager,
  })
  @Roles(Permissions.GymOwner)
  remove(@Param('id') id: string) {
    return this.gymOwnerService.remove(id);
  }

  @Get('me')
  @UseGuards(ManagerAuthGuard)
  @ApiOperation({ summary: 'Get the gym owner by id' })
  @ApiOkResponse({
    description: 'The gym owner has been successfully retrieved.',
    type: Manager,
  })
  @Roles(Permissions.GymOwner)
  getGymOwner(@User() user: Manager) {
    return returnManager(user);
  }

  @Post('add-gym')
  @UseGuards(ManagerAuthGuard)
  @ApiOperation({ summary: 'Add a gym to a gym owner' })
  @ApiOkResponse({
    description: 'The gym has been successfully added to the gym owner.',
    type: Gym,
  })
  @Roles(Permissions.GymOwner)
  addGym(@Body() createGymToGymOwnerDto: CreateGymToGymOwnerDto) {
    return this.gymOwnerService.createGymToGymOwner(createGymToGymOwnerDto);
  }

  @Get('/owners/get-all')
  @UseGuards(ManagerAuthGuard)
  @ApiOperation({ summary: 'Get all gym owners' })
  @ApiOkResponse({
    description: 'The gym owners have been successfully retrieved.',
    type: [Manager],
  })
  @Roles(Permissions.SuperAdmin)
  async getAllOwners() {
    return await this.gymOwnerService.findAll();
  }
}
