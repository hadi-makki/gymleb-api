import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { GymService } from './gym.service';
import { CreateGymDto } from './dto/create-gym.dto';
import { UpdateGymDto } from './dto/update-gym.dto';
import { ManagerAuthGuard } from '../guards/manager-auth.guard';
import { ApiBody, ApiOkResponse, ApiOperation } from '@nestjs/swagger';
import { Gym } from './entities/gym.entity';
import { Roles } from '../decorators/roles/Role';
import { Permissions } from '../decorators/roles/role.enum';
import { User } from '../decorators/users.decorator';
import { Manager } from '../manager/manager.entity';
import { UpdateGymNameDto } from './dto/update-name.dto';
import { UpdateGymNoteDto } from './dto/update-note.dto';
import { SubscriptionInstance } from '../transactions/subscription-instance.entity';
import { AddOfferDto } from './dto/add-offer.dto';
import { TransactionType } from '../transactions/transaction.entity';
@Controller('gym')
@Roles(Permissions.GymOwner, Permissions.gyms)
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
  @Roles(Permissions.Any)
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

  @Get('analytics/:gymId')
  @UseGuards(ManagerAuthGuard)
  @ApiOperation({ summary: 'Get gym analytics' })
  getGymAnalytics(
    @User() user: Manager,
    @Param('gymId') gymId: string,
    @Query('start') start?: string,
    @Query('end') end?: string,
  ) {
    return this.gymService.getGymAnalytics(user, start, end, gymId);
  }

  // Admin endpoints to query by owner id
  @Get('admin/:ownerId/analytics')
  @UseGuards(ManagerAuthGuard)
  @Roles(Permissions.SuperAdmin)
  async getGymAnalyticsByOwnerId(
    @Param('ownerId') ownerId: string,
    @Query('start') start?: string,
    @Query('end') end?: string,
  ) {
    return await this.gymService.getGymAnalyticsByOwnerId(ownerId, start, end);
  }

  @Get('admin/:ownerId/transactions')
  @UseGuards(ManagerAuthGuard)
  @Roles(Permissions.SuperAdmin)
  async getTransactionsByOwnerId(
    @Param('ownerId') ownerId: string,
    @Query('page') page = '1',
    @Query('limit') limit = '10',
    @Query('search') search?: string,
  ) {
    return await this.gymService.getTransactionHistoryByOwnerId(
      ownerId,
      Number(limit),
      Number(page),
      search || '',
    );
  }

  @Get('admin/:ownerId/members')
  @UseGuards(ManagerAuthGuard)
  @Roles(Permissions.SuperAdmin)
  getMembersByOwnerId(
    @Param('ownerId') ownerId: string,
    @Query('page') page = '1',
    @Query('limit') limit = '10',
    @Query('search') search?: string,
  ) {
    return this.gymService.getMembersByOwnerId(
      ownerId,
      Number(limit),
      Number(page),
      search,
    );
  }

  @Get('admin/:ownerId/summary')
  @UseGuards(ManagerAuthGuard)
  @Roles(Permissions.SuperAdmin)
  getOwnerSummary(@Param('ownerId') ownerId: string) {
    return this.gymService.getGymOwnerSummary(ownerId);
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
  @Roles(Permissions.SuperAdmin)
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

  @Patch('womens-times')
  @UseGuards(ManagerAuthGuard)
  @Roles(Permissions.GymOwner)
  @ApiOperation({ summary: "Update women's-only times" })
  async setWomensTimes(
    @User() user: Manager,
    @Body()
    body: {
      womensTimes: { day: string; from: string; to: string }[];
    },
  ) {
    return await this.gymService.setWomensTimes(user, body.womensTimes || []);
  }

  @Patch('update/note')
  @UseGuards(ManagerAuthGuard)
  @ApiOperation({ summary: 'Update gym note' })
  updateGymNote(
    @Body() updateGymNoteDto: UpdateGymNoteDto,
    @User() user: Manager,
  ) {
    return this.gymService.updateGymNote(user, updateGymNoteDto.note);
  }

  @Get('get-transaction-history/:gymId')
  @UseGuards(ManagerAuthGuard)
  @Roles(Permissions.GymOwner, Permissions.transactions)
  @ApiOperation({ summary: 'Get transaction history' })
  @ApiOkResponse({
    description: 'The transaction history has been successfully retrieved.',
    type: [SubscriptionInstance],
  })
  getTransactionHistory(
    @User() user: Manager,
    @Query('page') page = '1',
    @Query('limit') limit = '5',
    @Query('search') search: string,
    @Query('type') type: TransactionType,
    @Param('gymId') gymId: string,
  ) {
    return this.gymService.getTransactionHistory(
      user,
      Number(limit),
      Number(page),
      search,
      type,
      gymId,
    );
  }

  @Post('add-offer')
  @UseGuards(ManagerAuthGuard)
  @ApiOperation({ summary: 'Add a gym offer' })
  @ApiOkResponse({
    description: 'The gym offer has been successfully added.',
    type: Gym,
  })
  addGymOffer(@User() user: Manager, @Body() addOfferDto: AddOfferDto) {
    return this.gymService.addGymOffer(user, addOfferDto);
  }
}
