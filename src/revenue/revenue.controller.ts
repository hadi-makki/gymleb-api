import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { RevenueService } from './revenue.service';
import { CreateRevenueDto } from './dto/create-revenue.dto';
import { UpdateRevenueDto } from './dto/update-revenue.dto';
import { ManagerAuthGuard } from '../guards/manager-auth.guard';
import { Roles } from '../decorators/roles/Role';
import { Permissions } from '../decorators/roles/role.enum';
import { User } from '../decorators/users.decorator';
import { ApiOperation, ApiQuery } from '@nestjs/swagger';
import { ManagerEntity } from 'src/manager/manager.entity';
import { ValidateRevenueRelatedToGym } from 'src/decorators/validate-revenue-related-to-gym.decorator';

@Controller('revenue')
@UseGuards(ManagerAuthGuard)
@Roles(
  Permissions.GymOwner,
  Permissions.revenue,
  Permissions.personalTrainers,
  Permissions.products,
)
export class RevenueController {
  constructor(private readonly revenueService: RevenueService) {}

  @Post(':gymId')
  @ValidateRevenueRelatedToGym()
  @ApiOperation({ summary: 'Create a revenue entry' })
  create(
    @User() user: ManagerEntity,
    @Param('gymId') gymId: string,
    @Body() dto: CreateRevenueDto,
    @Query('isScanned') isScanned?: boolean,
  ) {
    return this.revenueService.create(user, dto, gymId, isScanned);
  }

  @Get('/gym/:gymId')
  @ValidateRevenueRelatedToGym()
  @ApiOperation({
    summary: 'List revenue entries (optionally filtered by date range)',
  })
  @ApiQuery({ name: 'start', required: false })
  @ApiQuery({ name: 'end', required: false })
  findAll(
    @User() user: ManagerEntity,
    @Param('gymId') gymId: string,
    @Query('start') start?: string,
    @Query('end') end?: string,
  ) {
    return this.revenueService.findAll(user, start, end, gymId);
  }

  @Get('total/:gymId')
  @ValidateRevenueRelatedToGym()
  @ApiOperation({ summary: 'Get total revenue for a date range' })
  @ApiQuery({ name: 'start', required: false })
  @ApiQuery({ name: 'end', required: false })
  getTotalRevenue(
    @User() user: ManagerEntity,
    @Param('gymId') gymId: string,
    @Query('start') start?: string,
    @Query('end') end?: string,
  ) {
    const startDate = start ? new Date(start) : undefined;
    const endDate = end ? new Date(end) : undefined;
    return this.revenueService.getTotalRevenue(user, startDate, endDate, gymId);
  }

  @Patch(':gymId/:id')
  @ValidateRevenueRelatedToGym()
  @ApiOperation({ summary: 'Update a revenue entry' })
  update(
    @User() user: ManagerEntity,
    @Param('gymId') gymId: string,
    @Param('id') id: string,
    @Body() dto: UpdateRevenueDto,
  ) {
    return this.revenueService.update(user, id, dto, gymId);
  }

  @Delete(':gymId/:id')
  @ValidateRevenueRelatedToGym()
  @ApiOperation({ summary: 'Delete a revenue entry' })
  remove(
    @User() user: ManagerEntity,
    @Param('gymId') gymId: string,
    @Param('id') id: string,
  ) {
    return this.revenueService.remove(user, id, gymId);
  }
}
