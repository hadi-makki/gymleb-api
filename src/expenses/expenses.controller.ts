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
import { ApiOperation, ApiQuery } from '@nestjs/swagger';
import { ManagerEntity } from 'src/manager/manager.entity';
import { Roles } from '../decorators/roles/Role';
import { Permissions } from '../decorators/roles/role.enum';
import { User } from '../decorators/users.decorator';
import { ManagerAuthGuard } from '../guards/manager-auth.guard';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { ExpensesService } from './expenses.service';

@Controller('expenses')
@UseGuards(ManagerAuthGuard)
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Post()
  @Roles(Permissions.GymOwner, Permissions.create_expenses)
  @ApiOperation({ summary: 'Create an expense' })
  async create(@User() user: ManagerEntity, @Body() dto: CreateExpenseDto) {
    return await this.expensesService.create(user, dto);
  }

  @Get('gym/:gymId')
  @Roles(Permissions.GymOwner, Permissions.read_expenses)
  @ApiOperation({
    summary: 'List expenses (optionally filtered by date range)',
  })
  @ApiQuery({ name: 'start', required: false })
  @ApiQuery({ name: 'end', required: false })
  async findAll(
    @User() user: ManagerEntity,
    @Param('gymId') gymId: string,
    @Query('start') start?: string,
    @Query('end') end?: string,
  ) {
    return await this.expensesService.findAll(user, start, end, gymId);
  }

  @Patch(':gymId/:id')
  @Roles(Permissions.GymOwner, Permissions.update_expenses)
  @ApiOperation({ summary: 'Update an expense' })
  async update(
    @User() user: ManagerEntity,
    @Param('gymId') gymId: string,
    @Param('id') id: string,
    @Body() dto: UpdateExpenseDto,
  ) {
    return await this.expensesService.update(user, id, dto, gymId);
  }

  @Delete(':gymId/:id')
  @Roles(Permissions.GymOwner, Permissions.delete_expenses)
  @ApiOperation({ summary: 'Delete an expense' })
  async remove(
    @User() user: ManagerEntity,
    @Param('gymId') gymId: string,
    @Param('id') id: string,
  ) {
    return await this.expensesService.remove(user, id, gymId);
  }
}
