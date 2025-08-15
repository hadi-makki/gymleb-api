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
import { Role } from '../decorators/roles/role.enum';
import { User } from '../decorators/users.decorator';
import { Manager } from '../manager/manager.entity';
import { ApiOperation, ApiQuery } from '@nestjs/swagger';

@Controller('revenue')
@Roles(Role.GymOwner)
@UseGuards(ManagerAuthGuard)
export class RevenueController {
  constructor(private readonly revenueService: RevenueService) {}

  @Post()
  @ApiOperation({ summary: 'Create a revenue entry' })
  create(@User() user: Manager, @Body() dto: CreateRevenueDto) {
    return this.revenueService.create(user, dto);
  }

  @Get()
  @ApiOperation({
    summary: 'List revenue entries (optionally filtered by date range)',
  })
  @ApiQuery({ name: 'start', required: false })
  @ApiQuery({ name: 'end', required: false })
  findAll(
    @User() user: Manager,
    @Query('start') start?: string,
    @Query('end') end?: string,
  ) {
    return this.revenueService.findAll(user, start, end);
  }

  @Get('total')
  @ApiOperation({ summary: 'Get total revenue for a date range' })
  @ApiQuery({ name: 'start', required: false })
  @ApiQuery({ name: 'end', required: false })
  getTotalRevenue(
    @User() user: Manager,
    @Query('start') start?: string,
    @Query('end') end?: string,
  ) {
    const startDate = start ? new Date(start) : undefined;
    const endDate = end ? new Date(end) : undefined;
    return this.revenueService.getTotalRevenue(user, startDate, endDate);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a revenue entry' })
  update(
    @User() user: Manager,
    @Param('id') id: string,
    @Body() dto: UpdateRevenueDto,
  ) {
    return this.revenueService.update(user, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a revenue entry' })
  remove(@User() user: Manager, @Param('id') id: string) {
    return this.revenueService.remove(user, id);
  }
}
