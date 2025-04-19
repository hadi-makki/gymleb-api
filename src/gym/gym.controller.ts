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
import { ManagerAuthGuard } from 'src/guards/manager-auth.guard';
import { ApiBody, ApiOkResponse, ApiOperation } from '@nestjs/swagger';
import { Gym } from './entities/gym.entity';
import { Roles } from 'src/decorators/roles/Role';
import { Role } from 'src/decorators/roles/role.enum';
import { User } from 'src/decorators/users.decorator';
import { Manager } from 'src/manager/manager.entity';
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

  @Get(':id')
  @UseGuards(ManagerAuthGuard)
  @ApiOperation({ summary: 'Get a gym by id' })
  @ApiOkResponse({
    description: 'The gym has been successfully retrieved.',
    type: Gym,
  })
  findOne(@Param('id') id: string) {
    return this.gymService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(ManagerAuthGuard)
  @ApiOperation({ summary: 'Update a gym by id' })
  @ApiOkResponse({
    description: 'The gym has been successfully updated.',
    type: Gym,
  })
  update(@Param('id') id: string, @Body() updateGymDto: UpdateGymDto) {
    return this.gymService.update(id, updateGymDto);
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
}
