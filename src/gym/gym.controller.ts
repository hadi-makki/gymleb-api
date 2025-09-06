import {
  BadRequestException,
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
import { ApiBody, ApiOkResponse, ApiOperation } from '@nestjs/swagger';
import { ManagerEntity } from 'src/manager/manager.entity';
import { Roles } from '../decorators/roles/Role';
import { Permissions } from '../decorators/roles/role.enum';
import { User } from '../decorators/users.decorator';
import { ManagerAuthGuard } from '../guards/manager-auth.guard';
import { GymEntity } from './entities/gym.entity';
import {
  TransactionEntity,
  TransactionType,
} from 'src/transactions/transaction.entity';
import { AddOfferDto } from './dto/add-offer.dto';
import { CreateGymDto } from './dto/create-gym.dto';
import { UpdateGymNameDto } from './dto/update-name.dto';
import { UpdateGymNoteDto } from './dto/update-note.dto';
import { UpdatePTPercentageDto } from './dto/update-pt-percentage.dto';
import { UpdateOpeningDayDto } from './dto/update-opening-day.dto';
import { GymService } from './gym.service';
import { UpdateGymLocationDto } from './dto/update-gym-location.dto';
import { UpdateSocialMediaDto } from './dto/update-social-media.dto';
import { SetSubscriptionDto } from './dto/set-subscription.dto';
import { UpdateAutoRenewDto } from './dto/update-auto-renew.dto';
import { UpdateAiChatDto } from './dto/update-ai-chat.dto';
import { ValidateGymRelatedToOwner } from 'src/decorators/validate-gym-related-to-owner.decorator';
import { SuccessMessageReturn } from 'src/main-classes/success-message-return';
import {
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
} from 'src/error/api-responses.decorator';
@Controller('gym')
@Roles(Permissions.GymOwner, Permissions.gyms)
export class GymController {
  constructor(private readonly gymService: GymService) {}

  @Post()
  @UseGuards(ManagerAuthGuard)
  @ApiOperation({ summary: 'Create a new gym' })
  @ApiOkResponse({
    description: 'The gym has been successfully created.',
    type: GymEntity,
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
    type: [GymEntity],
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
    type: GymEntity,
  })
  findOne(@Param('id') id: string) {
    return this.gymService.findOne(id);
  }

  @Delete(':id')
  @UseGuards(ManagerAuthGuard)
  @Roles(Permissions.SuperAdmin)
  @ApiOperation({ summary: 'Delete a gym by id' })
  @ApiOkResponse({
    description: 'The gym has been successfully deleted.',
    type: GymEntity,
  })
  remove(@Param('id') id: string) {
    return this.gymService.remove(id);
  }

  @Get('analytics/:gymId')
  @UseGuards(ManagerAuthGuard)
  @ApiOperation({ summary: 'Get gym analytics' })
  @ValidateGymRelatedToOwner()
  getGymAnalytics(
    @User() user: ManagerEntity,
    @Param('gymId') gymId: string,
    @Query('start') start?: string,
    @Query('end') end?: string,
  ) {
    return this.gymService.getGymAnalytics(user, start, end, gymId);
  }

  @Get('super-admin/analytics/:gymId')
  @UseGuards(ManagerAuthGuard)
  @Roles(Permissions.SuperAdmin)
  getSuperAdminGymAnalytics(
    @User() user: ManagerEntity,
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

  @Get('admin/analytics/:gymId')
  @UseGuards(ManagerAuthGuard)
  @Roles(Permissions.GymOwner)
  @ValidateGymRelatedToOwner()
  async getGymAnalyticsByOwnerIdAndGymId(
    @Param('gymId') gymId: string,
    @Query('start') start?: string,
    @Query('end') end?: string,
  ) {
    return await this.gymService.getGymAnalyticsByOwnerIdAndGymId(
      gymId,
      start,
      end,
    );
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
    type: GymEntity,
  })
  getGymByName(@Param('gymName') gymName: string) {
    return this.gymService.getGymByGymName(gymName);
  }

  @Get('public-reservation-config/:gymId')
  @ApiOperation({ summary: 'Get public reservation configuration for a gym' })
  @ApiOkResponse({
    description: 'Reservation configuration retrieved successfully.',
    schema: {
      type: 'object',
      properties: {
        allowUserResevations: { type: 'boolean' },
        openingDays: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              day: { type: 'string' },
              openingTime: { type: 'string' },
              closingTime: { type: 'string' },
              isOpen: { type: 'boolean' },
            },
          },
        },
        sessionTimeInHours: { type: 'number' },
        allowedUserResevationsPerSession: { type: 'number' },
      },
    },
  })
  getPublicReservationConfig(@Param('gymId') gymId: string) {
    return this.gymService.getPublicReservationConfig(gymId);
  }

  @Patch('day/:gymId')
  @UseGuards(ManagerAuthGuard)
  @ApiOperation({ summary: 'Update a gym day' })
  @ValidateGymRelatedToOwner()
  @ApiOkResponse({
    description: 'The gym day has been successfully updated.',
    type: GymEntity,
  })
  @ApiBody({ type: UpdateOpeningDayDto })
  updateGymDay(
    @Param('gymId') gymId: string,
    @Body() updateOpeningDayDto: UpdateOpeningDayDto,
  ) {
    return this.gymService.updateGymDay(gymId, updateOpeningDayDto);
  }

  @Get('admin/get-all-gyms')
  @UseGuards(ManagerAuthGuard)
  @Roles(Permissions.SuperAdmin)
  getAllGyms() {
    return this.gymService.getAllGyms();
  }

  @Patch('update/name/:gymId')
  @UseGuards(ManagerAuthGuard)
  @ApiOperation({ summary: 'Update gym name' })
  @ValidateGymRelatedToOwner()
  updateGymName(
    @Param('gymId') gymId: string,
    @Body() updateGymNameDto: UpdateGymNameDto,
  ) {
    return this.gymService.updateGymName(gymId, updateGymNameDto.name);
  }

  @Patch('finished-page-setup/:gymId')
  @UseGuards(ManagerAuthGuard)
  @ApiOperation({ summary: 'Set gym finished page setup' })
  @ValidateGymRelatedToOwner()
  async setGymFinishedPageSetup(
    @User() user: ManagerEntity,
    @Param('gymId') gymId: string,
  ) {
    return await this.gymService.setGymFinishedPageSetup(user, gymId);
  }

  @Patch('womens-times/:gymId')
  @UseGuards(ManagerAuthGuard)
  @Roles(Permissions.GymOwner)
  @ApiOperation({ summary: "Update women's-only times" })
  @ValidateGymRelatedToOwner()
  async setWomensTimes(
    @Param('gymId') gymId: string,
    @Body()
    body: {
      womensTimes: { day: string; from: string; to: string }[];
    },
  ) {
    return await this.gymService.setWomensTimes(gymId, body.womensTimes || []);
  }

  @Patch('update/note/:gymId')
  @UseGuards(ManagerAuthGuard)
  @ApiOperation({ summary: 'Update gym note' })
  @ValidateGymRelatedToOwner()
  updateGymNote(
    @Param('gymId') gymId: string,
    @Body() updateGymNoteDto: UpdateGymNoteDto,
  ) {
    return this.gymService.updateGymNote(gymId, updateGymNoteDto.note);
  }

  @Get('get-transaction-history/:gymId')
  @UseGuards(ManagerAuthGuard)
  @Roles(Permissions.GymOwner, Permissions.transactions)
  @ApiOperation({ summary: 'Get transaction history' })
  @ApiOkResponse({
    description: 'The transaction history has been successfully retrieved.',
    type: [TransactionEntity],
  })
  @ValidateGymRelatedToOwner()
  getTransactionHistory(
    @User() user: ManagerEntity,
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

  @Post('add-offer/:gymId')
  @UseGuards(ManagerAuthGuard)
  @ApiOperation({ summary: 'Add a gym offer' })
  @ApiOkResponse({
    description: 'The gym offer has been successfully added.',
    type: GymEntity,
  })
  @ValidateGymRelatedToOwner()
  addGymOffer(@Param('gymId') gymId: string, @Body() addOfferDto: AddOfferDto) {
    return this.gymService.addGymOffer(gymId, addOfferDto);
  }

  @Patch('pt-percentage/:gymId')
  @UseGuards(ManagerAuthGuard)
  @Roles(Permissions.GymOwner)
  @ApiOperation({ summary: "Update gym's PT session cut percentage" })
  @ApiOkResponse({ description: 'Updated gym', type: GymEntity })
  @ValidateGymRelatedToOwner()
  updatePTPercentage(
    @Param('gymId') gymId: string,
    @Body() body: UpdatePTPercentageDto,
  ) {
    return this.gymService.updatePTSessionPercentage(gymId, body.percentage);
  }

  @Get('owner/:ownerId/gyms')
  @UseGuards(ManagerAuthGuard)
  @ApiOperation({ summary: 'Get all gyms for a specific gym owner' })
  @ApiOkResponse({
    description: 'The gyms have been successfully retrieved.',
    type: [GymEntity],
  })
  @Roles(Permissions.GymOwner, Permissions.SuperAdmin)
  getGymsByOwner(@Param('ownerId') ownerId: string) {
    return this.gymService.getGymsByOwner(ownerId);
  }

  @Get('admin/transactions/:gymId')
  @UseGuards(ManagerAuthGuard)
  @Roles(Permissions.SuperAdmin)
  getGymTransactions(
    @Param('gymId') gymId: string,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Query('search') search?: string,
  ) {
    return this.gymService.getGymTransactions(
      gymId,
      Number(limit),
      Number(page),
      search,
    );
  }

  @Get('admin/members/:gymId')
  @UseGuards(ManagerAuthGuard)
  @Roles(Permissions.SuperAdmin)
  getGymMembers(
    @Param('gymId') gymId: string,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Query('search') search?: string,
  ) {
    return this.gymService.getGymMembers(
      gymId,
      Number(limit),
      Number(page),
      search,
    );
  }

  @Get('admin/all-transactions')
  @UseGuards(ManagerAuthGuard)
  @Roles(Permissions.SuperAdmin)
  getAllTransactions(
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Query('search') search?: string,
    @Query('type') type?: string,
    @Query('ownerId') ownerId?: string,
    @Query('gymId') gymId?: string,
  ) {
    return this.gymService.getAllTransactions(
      Number(limit),
      Number(page),
      search || '',
      type || '',
      ownerId || '',
      gymId || '',
    );
  }

  @Delete('admin/transaction/:transactionId')
  @UseGuards(ManagerAuthGuard)
  @Roles(Permissions.SuperAdmin)
  @ApiOperation({ summary: 'Delete any transaction (Super Admin only)' })
  @ApiOkResponse({
    description: 'Transaction deleted successfully.',
    type: SuccessMessageReturn,
  })
  @ApiBadRequestResponse()
  @ApiUnauthorizedResponse()
  deleteTransaction(@Param('transactionId') transactionId: string) {
    return this.gymService.deleteTransaction(transactionId);
  }

  @Delete('admin/transactions/bulk')
  @UseGuards(ManagerAuthGuard)
  @Roles(Permissions.SuperAdmin)
  @ApiOperation({ summary: 'Bulk delete transactions (Super Admin only)' })
  @ApiOkResponse({
    description: 'Transactions deleted successfully.',
    type: SuccessMessageReturn,
  })
  @ApiBadRequestResponse()
  @ApiUnauthorizedResponse()
  bulkDeleteTransactions(@Body() body: { transactionIds: string[] }) {
    return this.gymService.bulkDeleteTransactions(body.transactionIds);
  }

  @Get('admin/graphs/revenue/:gymId')
  @UseGuards(ManagerAuthGuard)
  @Roles(Permissions.SuperAdmin, Permissions.GymOwner)
  @ApiOperation({ summary: 'Get gym revenue graph data' })
  @ApiOkResponse({
    description: 'Revenue graph data retrieved successfully.',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          date: { type: 'string' },
          revenue: { type: 'number' },
          transactions: { type: 'number' },
        },
      },
    },
  })
  async getGymRevenueGraphData(
    @Param('gymId') gymId: string,
    @Query('start') start?: string,
    @Query('end') end?: string,
    @Query('isMobile') isMobile?: boolean,
  ) {
    try {
      return await this.gymService.getGymRevenueGraphData(
        gymId,
        start,
        end,
        isMobile,
      );
    } catch (error) {
      throw new BadRequestException('Failed to fetch revenue graph data');
    }
  }

  @Get('admin/graphs/member-growth/:gymId')
  @UseGuards(ManagerAuthGuard)
  @Roles(Permissions.SuperAdmin, Permissions.GymOwner)
  @ApiOperation({ summary: 'Get gym member growth graph data' })
  @ApiOkResponse({
    description: 'Member growth graph data retrieved successfully.',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          date: { type: 'string' },
          newMembers: { type: 'number' },
          cumulativeMembers: { type: 'number' },
        },
      },
    },
  })
  async getGymMemberGrowthGraphData(
    @Param('gymId') gymId: string,
    @Query('start') start?: string,
    @Query('end') end?: string,
    @Query('isMobile') isMobile?: boolean,
  ) {
    try {
      return await this.gymService.getGymMemberGrowthGraphData(
        gymId,
        start,
        end,
        isMobile,
      );
    } catch (error) {
      throw new BadRequestException('Failed to fetch member growth graph data');
    }
  }

  @Get('admin/graphs/transaction-trends/:gymId')
  @UseGuards(ManagerAuthGuard)
  @Roles(Permissions.SuperAdmin, Permissions.GymOwner)
  @ApiOperation({ summary: 'Get gym transaction trends graph data' })
  @ApiOkResponse({
    description: 'Transaction trends graph data retrieved successfully.',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          date: { type: 'string' },
          subscriptions: { type: 'number' },
          revenues: { type: 'number' },
          expenses: { type: 'number' },
          total: { type: 'number' },
        },
      },
    },
  })
  async getGymTransactionTrendsGraphData(
    @Param('gymId') gymId: string,
    @Query('start') start?: string,
    @Query('end') end?: string,
    @Query('isMobile') isMobile?: boolean,
  ) {
    try {
      return await this.gymService.getGymTransactionTrendsGraphData(
        gymId,
        start,
        end,
        isMobile,
      );
    } catch (error) {
      throw new BadRequestException(
        'Failed to fetch transaction trends graph data',
      );
    }
  }

  @Patch('show-personal-trainers/:gymId')
  @UseGuards(ManagerAuthGuard)
  @ApiOperation({ summary: 'Update gym show personal trainers setting' })
  @ValidateGymRelatedToOwner()
  updateShowPersonalTrainers(
    @Param('gymId') gymId: string,
    @Body() body: { showPersonalTrainers: boolean },
  ) {
    return this.gymService.updateShowPersonalTrainers(
      gymId,
      body.showPersonalTrainers,
    );
  }

  @Patch('allow-user-signup/:gymId')
  @UseGuards(ManagerAuthGuard)
  @ApiOperation({ summary: 'Update gym allow user signup setting' })
  @ValidateGymRelatedToOwner()
  updateAllowUserSignUp(
    @Param('gymId') gymId: string,
    @Body() body: { allowUserSignUp: boolean },
  ) {
    return this.gymService.updateAllowUserSignUp(gymId, body.allowUserSignUp);
  }

  @Patch('allow-user-reservations/:gymId')
  @UseGuards(ManagerAuthGuard)
  @ApiOperation({ summary: 'Update gym allow user reservations setting' })
  @ValidateGymRelatedToOwner()
  updateAllowUserReservations(
    @Param('gymId') gymId: string,
    @Body() body: { allowUserResevations: boolean },
  ) {
    return this.gymService.updateAllowUserReservations(
      gymId,
      body.allowUserResevations,
    );
  }

  @Patch('max-reservations-per-session/:gymId')
  @UseGuards(ManagerAuthGuard)
  @ApiOperation({ summary: 'Update max reservations allowed per session' })
  @ValidateGymRelatedToOwner()
  updateMaxReservationsPerSession(
    @Param('gymId') gymId: string,
    @Body() body: { allowedUserResevationsPerSession: number },
  ) {
    return this.gymService.updateMaxReservationsPerSession(
      gymId,
      body.allowedUserResevationsPerSession,
    );
  }

  @Patch('session-time/:gymId')
  @UseGuards(ManagerAuthGuard)
  @ApiOperation({ summary: 'Update gym session time in hours (0.25 steps)' })
  @ValidateGymRelatedToOwner()
  updateSessionTime(
    @Param('gymId') gymId: string,
    @Body() body: { sessionTimeInHours: number },
  ) {
    return this.gymService.updateSessionTimeInHours(
      gymId,
      body.sessionTimeInHours,
    );
  }

  @Delete('admin/delete-gym/:gymId')
  @UseGuards(ManagerAuthGuard)
  @Roles(Permissions.SuperAdmin)
  deleteGym(@Param('gymId') gymId: string) {
    return this.gymService.deleteGym(gymId);
  }

  @Patch('location/:gymId')
  @UseGuards(ManagerAuthGuard)
  @ApiOperation({ summary: 'Update gym location' })
  @ValidateGymRelatedToOwner()
  async updateGymAddress(
    @Param('gymId') gymId: string,
    @Body() body: UpdateGymLocationDto,
  ) {
    return await this.gymService.updateGymAddress(gymId, body);
  }

  @Patch('social-media/:gymId')
  @UseGuards(ManagerAuthGuard)
  @ApiOperation({ summary: 'Update gym social media links' })
  @ValidateGymRelatedToOwner()
  async updateSocialMediaLinks(
    @Param('gymId') gymId: string,
    @Body() body: UpdateSocialMediaDto,
  ) {
    return await this.gymService.updateSocialMediaLinks(gymId, body);
  }

  @Patch('subscription/set-subscription/:gymId')
  @UseGuards(ManagerAuthGuard)
  @ApiOperation({ summary: 'Set subscription to gym' })
  @ApiBody({ type: SetSubscriptionDto })
  @Roles(Permissions.SuperAdmin)
  async setSubscriptionToGym(
    @Param('gymId') gymId: string,
    @Body() body: SetSubscriptionDto,
  ) {
    return await this.gymService.setSubscriptionToGym(
      body.subscriptionTypeId,
      gymId,
      body.resetNotifications,
      body.startDate,
      body.endDate,
    );
  }

  @Patch('update/auto-renew/:gymId')
  @UseGuards(ManagerAuthGuard)
  @ApiOperation({ summary: 'Update gym auto-renewal status' })
  @ApiOkResponse({ description: 'Auto-renewal status updated successfully' })
  @Roles(Permissions.SuperAdmin)
  async updateAutoRenew(
    @Param('gymId') gymId: string,
    @Body() updateAutoRenewDto: UpdateAutoRenewDto,
  ) {
    return await this.gymService.updateAutoRenew(
      gymId,
      updateAutoRenewDto.isAutoRenew,
    );
  }

  @Patch('update/ai-chat/:gymId')
  @UseGuards(ManagerAuthGuard)
  @ApiOperation({ summary: 'Update gym AI chat feature status' })
  @ApiOkResponse({ description: 'AI chat status updated successfully' })
  @Roles(Permissions.SuperAdmin)
  async updateAiChatStatus(
    @Param('gymId') gymId: string,
    @Body() updateAiChatDto: UpdateAiChatDto,
  ) {
    return await this.gymService.updateAiChatStatus(
      gymId,
      updateAiChatDto.isAiChatEnabled,
    );
  }
}
