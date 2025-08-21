import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { StaffService } from './staff.service';
import { CreateStaffDto } from './dto/create-staff.dto';
import { UpdateStaffDto } from './dto/update-staff.dto';
import { User } from 'src/decorators/users.decorator';
import { Manager } from 'src/manager/manager.entity';
import { UseGuards } from '@nestjs/common';
import { ManagerAuthGuard } from 'src/guards/manager-auth.guard';
import { Roles } from 'src/decorators/roles/Role';
import { Permissions, returnAllRoles } from 'src/decorators/roles/role.enum';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';

@Controller('staff')
@ApiTags('Staff')
export class StaffController {
  constructor(private readonly staffService: StaffService) {}

  @Post()
  @UseGuards(ManagerAuthGuard)
  @ApiBearerAuth()
  @Roles(Permissions.GymOwner)
  async create(@Body() createStaffDto: CreateStaffDto, @User() user: Manager) {
    return await this.staffService.create(createStaffDto, user);
  }

  @Get('gym/:gymId')
  @UseGuards(ManagerAuthGuard)
  @ApiBearerAuth()
  @Roles(Permissions.GymOwner)
  @ApiOkResponse({ type: [Manager] })
  findAll(@User() user: Manager, @Param('gymId') gymId: string) {
    return this.staffService.findAll(user, gymId);
  }

  @Get(':id')
  @UseGuards(ManagerAuthGuard)
  @ApiBearerAuth()
  @Roles(Permissions.GymOwner)
  findOne(@Param('id') id: string, @User() user: Manager) {
    return this.staffService.findOne(id, user);
  }

  @Patch(':gymId/:id')
  @UseGuards(ManagerAuthGuard)
  @ApiBearerAuth()
  @Roles(Permissions.GymOwner)
  update(
    @Param('gymId') gymId: string,
    @Param('id') id: string,
    @User() user: Manager,
    @Body() updateStaffDto: UpdateStaffDto,
  ) {
    return this.staffService.update(id, user, gymId, updateStaffDto);
  }

  @Delete(':gymId/:id')
  @UseGuards(ManagerAuthGuard)
  @ApiBearerAuth()
  @Roles(Permissions.GymOwner)
  remove(
    @Param('gymId') gymId: string,
    @Param('id') id: string,
    @User() user: Manager,
  ) {
    return this.staffService.remove(id, user, gymId);
  }

  @Get('permissions/all')
  @UseGuards(ManagerAuthGuard)
  @ApiBearerAuth()
  @Roles(Permissions.GymOwner)
  getAllPermissions() {
    return returnAllRoles();
  }
}
