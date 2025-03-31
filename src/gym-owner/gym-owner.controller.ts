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
import { GymOwnerService } from './gym-owner.service';
import { CreateGymOwnerDto } from './dto/create-gym-owner.dto';
import { UpdateGymOwnerDto } from './dto/update-gym-owner.dto';
import { ManagerAuthGuard } from 'src/guards/manager-auth.guard';
import { ApiOkResponse, ApiOperation } from '@nestjs/swagger';
import { GymOwner } from './entities/gym-owner.entity';

@Controller('gym-owner')
export class GymOwnerController {
  constructor(private readonly gymOwnerService: GymOwnerService) {}

  @Post()
  @UseGuards(ManagerAuthGuard)
  @ApiOperation({ summary: 'Create a gym owner' })
  @ApiOkResponse({
    description: 'The gym owner has been successfully created.',
    type: GymOwner,
  })
  create(@Body() createGymOwnerDto: CreateGymOwnerDto) {
    return this.gymOwnerService.create(createGymOwnerDto);
  }

  @Get()
  @UseGuards(ManagerAuthGuard)
  @ApiOperation({ summary: 'Get all gym owners' })
  @ApiOkResponse({
    description: 'The gym owners have been successfully retrieved.',
    type: [GymOwner],
  })
  findAll() {
    return this.gymOwnerService.findAll();
  }

  @Get(':id')
  @UseGuards(ManagerAuthGuard)
  @ApiOperation({ summary: 'Get a gym owner by id' })
  @ApiOkResponse({
    description: 'The gym owner has been successfully retrieved.',
    type: GymOwner,
  })
  findOne(@Param('id') id: string) {
    return this.gymOwnerService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(ManagerAuthGuard)
  @ApiOperation({ summary: 'Update a gym owner by id' })
  @ApiOkResponse({
    description: 'The gym owner has been successfully updated.',
    type: GymOwner,
  })
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
    type: GymOwner,
  })
  remove(@Param('id') id: string) {
    return this.gymOwnerService.remove(id);
  }
}
