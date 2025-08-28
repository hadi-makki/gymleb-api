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
import { ExpensesService } from './expenses.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { ManagerAuthGuard } from '../guards/manager-auth.guard';
import { Roles } from '../decorators/roles/Role';
import { Permissions } from '../decorators/roles/role.enum';
import { User } from '../decorators/users.decorator';
import { Manager } from '../manager/manager.model';
import { ApiOperation, ApiQuery } from '@nestjs/swagger';

@Controller('expenses')
@Roles(Permissions.GymOwner, Permissions.expenses)
@UseGuards(ManagerAuthGuard)
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Post()
  @ApiOperation({ summary: 'Create an expense' })
  create(@User() user: Manager, @Body() dto: CreateExpenseDto) {
    return this.expensesService.create(user, dto);
  }

  @Get('gym/:gymId')
  @ApiOperation({
    summary: 'List expenses (optionally filtered by date range)',
  })
  @ApiQuery({ name: 'start', required: false })
  @ApiQuery({ name: 'end', required: false })
  findAll(
    @User() user: Manager,
    @Param('gymId') gymId: string,
    @Query('start') start?: string,
    @Query('end') end?: string,
  ) {
    return this.expensesService.findAll(user, start, end, gymId);
  }

  @Patch(':gymId/:id')
  @ApiOperation({ summary: 'Update an expense' })
  update(
    @User() user: Manager,
    @Param('gymId') gymId: string,
    @Param('id') id: string,
    @Body() dto: UpdateExpenseDto,
  ) {
    return this.expensesService.update(user, id, dto, gymId);
  }

  @Delete(':gymId/:id')
  @ApiOperation({ summary: 'Delete an expense' })
  remove(
    @User() user: Manager,
    @Param('gymId') gymId: string,
    @Param('id') id: string,
  ) {
    return this.expensesService.remove(user, id, gymId);
  }
}
