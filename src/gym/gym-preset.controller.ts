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
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { GymPresetService } from './gym-preset.service';
import { CreateGymPresetDto, UpdateGymPresetDto } from './dto/gym-preset.dto';
import { ManagerAuthGuard } from '../guards/manager-auth.guard';
import { Permissions } from '../decorators/roles/role.enum';
import { Roles } from '../decorators/roles/Role';

@ApiTags('Gym Presets')
@Controller('gym-presets')
export class GymPresetController {
  constructor(private readonly gymPresetService: GymPresetService) {}

  @Post(':gymId')
  @Roles(Permissions.GymOwner, Permissions.members)
  @UseGuards(ManagerAuthGuard)
  @ApiOperation({
    summary: 'Create gym preset',
    description: 'Create a new time preset for a gym',
  })
  create(
    @Param('gymId') gymId: string,
    @Body() createGymPresetDto: CreateGymPresetDto,
  ) {
    return this.gymPresetService.create(gymId, createGymPresetDto);
  }

  @Get(':gymId')
  @Roles(Permissions.GymOwner, Permissions.members)
  @UseGuards(ManagerAuthGuard)
  @ApiOperation({
    summary: 'Get gym presets',
    description: 'Get all time presets for a gym',
  })
  findAll(@Param('gymId') gymId: string) {
    return this.gymPresetService.findAll(gymId);
  }

  @Get(':gymId/:id')
  @Roles(Permissions.GymOwner, Permissions.members)
  @UseGuards(ManagerAuthGuard)
  @ApiOperation({
    summary: 'Get gym preset',
    description: 'Get a specific time preset for a gym',
  })
  findOne(@Param('id') id: string, @Param('gymId') gymId: string) {
    return this.gymPresetService.findOne(id, gymId);
  }

  @Patch(':gymId/:id')
  @Roles(Permissions.GymOwner, Permissions.members)
  @UseGuards(ManagerAuthGuard)
  @ApiOperation({
    summary: 'Update gym preset',
    description: 'Update a time preset for a gym',
  })
  update(
    @Param('id') id: string,
    @Param('gymId') gymId: string,
    @Body() updateGymPresetDto: UpdateGymPresetDto,
  ) {
    return this.gymPresetService.update(id, gymId, updateGymPresetDto);
  }

  @Delete(':gymId/:id')
  @Roles(Permissions.GymOwner, Permissions.members)
  @UseGuards(ManagerAuthGuard)
  @ApiOperation({
    summary: 'Delete gym preset',
    description: 'Delete a time preset for a gym',
  })
  remove(@Param('id') id: string, @Param('gymId') gymId: string) {
    return this.gymPresetService.remove(id, gymId);
  }
}
