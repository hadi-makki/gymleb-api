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
import { ApiOperation } from '@nestjs/swagger';
import { BillsService } from './bills.service';
import { CreateBillDto } from './dto/create-bill.dto';
import { UpdateBillDto } from './dto/update-bill.dto';
import { MarkBillPaidDto } from './dto/mark-bill-paid.dto';
import { ManagerEntity } from 'src/manager/manager.entity';
import { Roles } from '../decorators/roles/Role';
import { Permissions } from '../decorators/roles/role.enum';
import { User } from '../decorators/users.decorator';
import { ManagerAuthGuard } from '../guards/manager-auth.guard';

@Controller('bills')
@Roles(Permissions.GymOwner, Permissions.expenses)
@UseGuards(ManagerAuthGuard)
export class BillsController {
  constructor(private readonly billsService: BillsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a bill' })
  async create(
    @User() user: ManagerEntity,
    @Body() createBillDto: CreateBillDto,
  ) {
    return await this.billsService.create(user, createBillDto);
  }

  @Get('gym/:gymId')
  @ApiOperation({ summary: 'Get all bills for a gym' })
  async findAll(@User() user: ManagerEntity, @Param('gymId') gymId: string) {
    return await this.billsService.findAll(user, gymId);
  }

  @Get('upcoming/:gymId')
  @ApiOperation({ summary: 'Get the next upcoming unpaid bill for a gym' })
  async getUpcomingBill(
    @User() user: ManagerEntity,
    @Param('gymId') gymId: string,
  ) {
    return await this.billsService.getUpcomingBill(user, gymId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single bill' })
  async findOne(@User() user: ManagerEntity, @Param('id') id: string) {
    return await this.billsService.findOne(user, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a bill' })
  async update(
    @User() user: ManagerEntity,
    @Param('id') id: string,
    @Body() updateBillDto: UpdateBillDto,
  ) {
    return await this.billsService.update(user, id, updateBillDto);
  }

  @Post(':id/mark-paid')
  @ApiOperation({ summary: 'Mark a bill as paid and create expense' })
  async markAsPaid(
    @User() user: ManagerEntity,
    @Param('id') id: string,
    @Body() markBillPaidDto: MarkBillPaidDto,
  ) {
    return await this.billsService.markAsPaid(user, id, markBillPaidDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a bill' })
  async remove(@User() user: ManagerEntity, @Param('id') id: string) {
    return await this.billsService.remove(user, id);
  }
}
