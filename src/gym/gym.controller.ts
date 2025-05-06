import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { GymService } from './gym.service';
import { CreateGymDto } from './dto/create-gym.dto';
import { UpdateGymDto } from './dto/update-gym.dto';
import { ManagerAuthGuard } from '../guards/manager-auth.guard';
import { ApiBody, ApiOkResponse, ApiOperation } from '@nestjs/swagger';
import { Gym } from './entities/gym.entity';
import { Roles } from '../decorators/roles/Role';
import { Role } from '../decorators/roles/role.enum';
import { User } from '../decorators/users.decorator';
import { Manager } from '../manager/manager.entity';
import { UpdateGymNameDto } from './dto/update-name.dto';
import { Transaction } from 'src/transactions/transaction.entity';
@Controller('gym')
@Roles(Role.GymOwner)
export class GymController {
  constructor(private readonly gymService: GymService) {}

  @Post()
  @UseGuards(ManagerAuthGuard)
  @ApiOperation({ summary: 'Create a new gym' })
  @ApiOkResponse({
    description: 'The gym has been successfully created.',
    type: Gym,
  })
  @ApiBody({ type: CreateGymDto })
  create(@Body() createGymDto: CreateGymDto) {
    return this.gymService.create(createGymDto);
  }

  @Get()
  @UseGuards(ManagerAuthGuard)
  @ApiOperation({ summary: 'Get all gyms' })
  @ApiOkResponse({
    description: 'The gyms have been successfully retrieved.',
    type: [Gym],
  })
  findAll() {
    return this.gymService.findAll();
  }

  @Get('/get-one/:id')
  @UseGuards(ManagerAuthGuard)
  @ApiOperation({ summary: 'Get a gym by id' })
  @ApiOkResponse({
    description: 'The gym has been successfully retrieved.',
    type: Gym,
  })
  findOne(@Param('id') id: string) {
    return this.gymService.findOne(id);
  }

  @Delete(':id')
  @UseGuards(ManagerAuthGuard)
  @ApiOperation({ summary: 'Delete a gym by id' })
  @ApiOkResponse({
    description: 'The gym has been successfully deleted.',
    type: Gym,
  })
  remove(@Param('id') id: string) {
    return this.gymService.remove(id);
  }

  @Get('analytics')
  @UseGuards(ManagerAuthGuard)
  @ApiOperation({ summary: 'Get gym analytics' })
  getGymAnalytics(@User() user: Manager) {
    return this.gymService.getGymAnalytics(user);
  }

  @Get('by-name/:gymName')
  @ApiOperation({ summary: 'Get gym by name' })
  @ApiOkResponse({
    description: 'The gym has been successfully retrieved.',
    type: Gym,
  })
  getGymByName(@Param('gymName') gymName: string) {
    return this.gymService.getGymByGymName(gymName);
  }

  @Patch('day/:day')
  @UseGuards(ManagerAuthGuard)
  @ApiOperation({ summary: 'Update a gym day' })
  @ApiOkResponse({
    description: 'The gym day has been successfully updated.',
    type: Gym,
  })
  updateGymDay(@Param('day') day: string, @User() user: Manager) {
    return this.gymService.updateGymDay(day, user);
  }

  @Get('admin/get-all-gyms')
  @UseGuards(ManagerAuthGuard)
  @Roles(Role.SuperAdmin)
  getAllGyms() {
    return this.gymService.getAllGyms();
  }

  @Patch('update/name')
  @UseGuards(ManagerAuthGuard)
  @ApiOperation({ summary: 'Update gym name' })
  updateGymName(
    @Body() updateGymNameDto: UpdateGymNameDto,
    @User() user: Manager,
  ) {
    return this.gymService.updateGymName(user, updateGymNameDto.name);
  }

  @Patch('finished-page-setup')
  @UseGuards(ManagerAuthGuard)
  @ApiOperation({ summary: 'Set gym finished page setup' })
  async setGymFinishedPageSetup(@User() user: Manager) {
    return await this.gymService.setGymFinishedPageSetup(user);
  }

  @Get('get-transaction-history')
  @UseGuards(ManagerAuthGuard)
  @ApiOperation({ summary: 'Get transaction history' })
  @ApiOkResponse({
    description: 'The transaction history has been successfully retrieved.',
    type: [Transaction],
  })
  getTransactionHistory(@User() user: Manager) {
    return this.gymService.getTransactionHistory(user);
  }
}
