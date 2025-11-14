import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  Patch,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiBody, ApiOkResponse, ApiOperation } from '@nestjs/swagger';
import { ValidateGymRelatedToManagerOrManagerInGym } from 'src/decorators/validate-gym-related-to-manager-or-manager-in-gym.dto';
import { ValidateGymRelatedToOwner } from 'src/decorators/validate-gym-related-to-owner.decorator';
import {
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
} from 'src/error/api-responses.decorator';
import { SuccessMessageReturn } from 'src/main-classes/success-message-return';
import { ManagerEntity } from 'src/manager/manager.entity';
import {
  PaymentStatus,
  TransactionEntity,
  TransactionType,
} from 'src/transactions/transaction.entity';
import { Roles } from '../decorators/roles/Role';
import { Permissions } from '../decorators/roles/role.enum';
import { User } from '../decorators/users.decorator';
import { ManagerAuthGuard } from '../guards/manager-auth.guard';
import { AddOfferDto } from './dto/add-offer.dto';
import { CreateGymDto } from './dto/create-gym.dto';
import { PublicGymDto } from './dto/public-gym.dto';
import { SetSubscriptionDto } from './dto/set-subscription.dto';
import { UpdateAiChatDto } from './dto/update-ai-chat.dto';
import { UpdateAutoRenewDto } from './dto/update-auto-renew.dto';
import { UpdateGymLocationDto } from './dto/update-gym-location.dto';
import { UpdateGymPhoneDto } from './dto/update-gym-phone.dto';
import { UpdateInvoiceMessagesDto } from './dto/update-invoice-messages.dto';
import { UpdateMessageLanguageDto } from './dto/update-message-language.dto';
import { UpdateMultiSubscriptionDto } from './dto/update-multi-subscription.dto';
import { UpdateGymNameDto } from './dto/update-name.dto';
import { UpdateGymNoteDto } from './dto/update-note.dto';
import { UpdateOpeningDayDto } from './dto/update-opening-day.dto';
import { UpdatePTPercentageDto } from './dto/update-pt-percentage.dto';
import { UpdateSocialMediaDto } from './dto/update-social-media.dto';
import { UpdateShowPersonalTrainersDto } from './dto/update-show-personal-trainers.dto';
import { UpdateAllowMemberEditTrainingProgramDto } from './dto/update-allow-member-edit-training-program.dto';
import { UpdateAllowUserSignupDto } from './dto/update-allow-user-signup.dto';
import { UpdateBirthdayAutomationDto } from './dto/update-birthday-automation.dto';
import { UpdateAllowMembersSetPtTimesDto } from './dto/update-allow-members-set-pt-times.dto';
import { UpdateMonthlyReminderDto } from './dto/update-monthly-reminder.dto';
import { UpdateManualMessagesDto } from './dto/update-manual-messages.dto';
import { UpdateAllowDuplicateMemberPhonesDto } from './dto/update-allow-duplicate-member-phones.dto';
import { UpdateAllowUserWithoutPhoneNumberDto } from './dto/update-allow-user-without-phone.dto';
import { UpdateSessionTimeDto } from './dto/update-session-time.dto';
import { UpdateWomensTimesDto } from './dto/update-womens-times.dto';
import { UpdateGymDescriptionDto } from './dto/update-gym-description.dto';
import { UpdateWelcomeMessageAutomationDto } from './dto/update-welcome-message-automation.dto';
import { UpdateRestrictPublicProgramsDto } from './dto/update-restrict-public-programs.dto';
import { BulkDeleteTransactionsDto } from './dto/bulk-delete-transactions.dto';
import { GymEntity } from './entities/gym.entity';
import { GymService } from './gym.service';
import { Currency } from 'src/common/enums/currency.enum';

@Controller('gym')
export class GymController {
  constructor(private readonly gymService: GymService) {}

  // Public endpoints (no authentication required)
  @Get('public')
  @ApiOperation({ summary: 'Get all public gyms (no authentication required)' })
  @ApiOkResponse({
    description: 'The public gyms have been successfully retrieved.',
    type: [PublicGymDto],
  })
  getPublicGyms() {
    return this.gymService.getPublicGyms();
  }

  @Get('public/by-name/:gymDashedName')
  @ApiOperation({
    summary: 'Get public gym by dashed name (no authentication required)',
  })
  @ApiOkResponse({
    description: 'The public gym has been successfully retrieved.',
    type: PublicGymDto,
  })
  getPublicGymByName(@Param('gymDashedName') gymDashedName: string) {
    return this.gymService.getPublicGymByName(gymDashedName);
  }

  @Get('public/:id')
  @ApiOperation({
    summary: 'Get public gym by id (no authentication required)',
  })
  @ApiOkResponse({
    description: 'The public gym has been successfully retrieved.',
    type: PublicGymDto,
  })
  getPublicGymById(@Param('id') id: string) {
    return this.gymService.getPublicGymById(id);
  }

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

  @Get('/get-one/:gymId')
  @UseGuards(ManagerAuthGuard)
  @Roles(Permissions.Any)
  @ApiOperation({ summary: 'Get a gym by id' })
  @ApiOkResponse({
    description: 'The gym has been successfully retrieved.',
    type: GymEntity,
  })
  findOne(@Param('gymId') id: string) {
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
  @Roles(Permissions.GymOwner, Permissions.SuperAdmin)
  @ApiOperation({ summary: 'Get gym analytics' })
  @ValidateGymRelatedToOwner()
  getGymAnalytics(
    @User() user: ManagerEntity,
    @Param('gymId') gymId: string,
    @Query('start') start?: string,
    @Query('end') end?: string,
    @Headers('currency') currency?: Currency,
  ) {
    return this.gymService.getGymAnalytics(user, start, end, gymId, currency);
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
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const currency = (arguments?.[0]?.headers?.currency as any) || undefined;
    return this.gymService.getGymAnalytics(user, start, end, gymId, currency);
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

  @Patch('day/:gymId')
  @UseGuards(ManagerAuthGuard)
  @Roles(Permissions.GymOwner)
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
  @Roles(Permissions.GymOwner)
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
  @Roles(Permissions.GymOwner)
  async setGymFinishedPageSetup(
    @User() user: ManagerEntity,
    @Param('gymId') gymId: string,
  ) {
    return await this.gymService.setGymFinishedPageSetup(user, gymId);
  }

  @Patch('restrict-public-programs/:gymId')
  @UseGuards(ManagerAuthGuard)
  @ApiOperation({
    summary: 'Toggle restrict public programs to active members',
  })
  @ValidateGymRelatedToOwner()
  @Roles(Permissions.GymOwner)
  @ApiBody({ type: UpdateRestrictPublicProgramsDto })
  async setRestrictPublicPrograms(
    @User() user: ManagerEntity,
    @Param('gymId') gymId: string,
    @Body() updateRestrictPublicProgramsDto: UpdateRestrictPublicProgramsDto,
  ) {
    return await this.gymService.setRestrictPublicPrograms(
      user,
      gymId,
      updateRestrictPublicProgramsDto.restrict,
    );
  }

  @Patch('womens-times/:gymId')
  @UseGuards(ManagerAuthGuard)
  @Roles(Permissions.GymOwner)
  @ApiOperation({ summary: "Update women's-only times" })
  @ValidateGymRelatedToOwner()
  @ApiBody({ type: UpdateWomensTimesDto })
  async setWomensTimes(
    @Param('gymId') gymId: string,
    @Body() updateWomensTimesDto: UpdateWomensTimesDto,
  ) {
    return await this.gymService.setWomensTimes(
      gymId,
      updateWomensTimesDto.womensTimes || [],
    );
  }

  @Patch('update/note/:gymId')
  @UseGuards(ManagerAuthGuard)
  @ApiOperation({ summary: 'Update gym note' })
  @ValidateGymRelatedToOwner()
  @Roles(Permissions.GymOwner)
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
    @Query('status') status: string,
  ) {
    return this.gymService.getTransactionHistory(
      user,
      Number(limit),
      Number(page),
      search,
      type,
      gymId,
      status,
    );
  }

  @Post('add-offer/:gymId')
  @UseGuards(ManagerAuthGuard)
  @ApiOperation({ summary: 'Add a gym offer' })
  @Roles(Permissions.GymOwner)
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
  @ApiBody({ type: BulkDeleteTransactionsDto })
  bulkDeleteTransactions(
    @Body() bulkDeleteTransactionsDto: BulkDeleteTransactionsDto,
  ) {
    return this.gymService.bulkDeleteTransactions(
      bulkDeleteTransactionsDto.transactionIds,
    );
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

  @Get('admin/graphs/churn/:gymId')
  @UseGuards(ManagerAuthGuard)
  @Roles(Permissions.SuperAdmin, Permissions.GymOwner)
  @ApiOperation({ summary: 'Get gym churn graph and metrics' })
  @ApiOkResponse({
    description: 'Churn graph data retrieved successfully.',
  })
  async getGymChurnGraphData(
    @Param('gymId') gymId: string,
    @Query('start') start?: string,
    @Query('end') end?: string,
    @Query('isMobile') isMobile?: boolean,
  ) {
    try {
      return await this.gymService.getGymChurnGraphData(
        gymId,
        start,
        end,
        isMobile,
      );
    } catch (error) {
      throw new BadRequestException('Failed to fetch churn graph data');
    }
  }

  // New analytics endpoints (last 30 days default)
  @Get('admin/analytics/members/new-vs-returning/:gymId')
  @UseGuards(ManagerAuthGuard)
  @Roles(Permissions.SuperAdmin, Permissions.GymOwner)
  @ApiOperation({
    summary: 'New vs Returning members (last 30 days by default)',
  })
  async getNewVsReturningMembers(
    @Param('gymId') gymId: string,
    @Query('start') start?: string,
    @Query('end') end?: string,
    @Query('isMobile') isMobile?: boolean,
  ) {
    return this.gymService.getNewVsReturningMembers(
      gymId,
      start,
      end,
      isMobile,
    );
  }

  @Get('admin/analytics/members/active-vs-inactive/:gymId')
  @UseGuards(ManagerAuthGuard)
  @Roles(Permissions.SuperAdmin, Permissions.GymOwner)
  @ApiOperation({
    summary: 'Active vs Inactive members (last 30 days default window)',
  })
  async getActiveVsInactiveMembers(
    @Param('gymId') gymId: string,
    @Query('start') start?: string,
    @Query('end') end?: string,
  ) {
    return this.gymService.getActiveVsInactiveMembers(gymId, start, end);
  }

  @Get('admin/analytics/members/membership-type-breakdown/:gymId')
  @UseGuards(ManagerAuthGuard)
  @Roles(Permissions.SuperAdmin, Permissions.GymOwner)
  @ApiOperation({
    summary: 'Membership type breakdown (last 30 days default window)',
  })
  async getMembershipTypeBreakdown(
    @Param('gymId') gymId: string,
    @Query('start') start?: string,
    @Query('end') end?: string,
  ) {
    return this.gymService.getMembershipTypeBreakdown(gymId, start, end);
  }

  @Get('admin/analytics/members/average-membership-duration/:gymId')
  @UseGuards(ManagerAuthGuard)
  @Roles(Permissions.SuperAdmin, Permissions.GymOwner)
  @ApiOperation({ summary: 'Average membership duration within window' })
  async getAverageMembershipDuration(
    @Param('gymId') gymId: string,
    @Query('start') start?: string,
    @Query('end') end?: string,
  ) {
    return this.gymService.getAverageMembershipDuration(gymId, start, end);
  }

  @Get('admin/analytics/members/demographics/:gymId')
  @UseGuards(ManagerAuthGuard)
  @Roles(Permissions.SuperAdmin, Permissions.GymOwner)
  @ApiOperation({
    summary: 'Member demographics (gender, age buckets) within window',
  })
  async getMemberDemographics(
    @Param('gymId') gymId: string,
    @Query('start') start?: string,
    @Query('end') end?: string,
  ) {
    return this.gymService.getMemberDemographics(gymId, start, end);
  }

  @Get('admin/analytics/revenue/by-source/:gymId')
  @UseGuards(ManagerAuthGuard)
  @Roles(Permissions.SuperAdmin, Permissions.GymOwner)
  @ApiOperation({
    summary:
      'Revenue by source (subscriptions, PT, products, revenue categories)',
  })
  async getRevenueBySource(
    @Param('gymId') gymId: string,
    @Query('start') start?: string,
    @Query('end') end?: string,
    @Headers('currency') currency?: Currency,
  ) {
    return this.gymService.getRevenueBySource(gymId, start, end, currency);
  }

  @Get('admin/analytics/revenue/arpu/:gymId')
  @UseGuards(ManagerAuthGuard)
  @Roles(Permissions.SuperAdmin, Permissions.GymOwner)
  @ApiOperation({ summary: 'Average Revenue Per User within window' })
  async getArpu(
    @Param('gymId') gymId: string,
    @Query('start') start?: string,
    @Query('end') end?: string,
  ) {
    return this.gymService.getArpu(gymId, start, end);
  }

  @Get('admin/analytics/revenue/outstanding-payments/:gymId')
  @UseGuards(ManagerAuthGuard)
  @Roles(Permissions.SuperAdmin, Permissions.GymOwner)
  @ApiOperation({
    summary: 'Outstanding payments totals and count within window',
  })
  async getOutstandingPayments(
    @Param('gymId') gymId: string,
    @Query('start') start?: string,
    @Query('end') end?: string,
  ) {
    return this.gymService.getOutstandingPayments(gymId, start, end);
  }

  @Get('admin/analytics/revenue/recurring-vs-onetime/:gymId')
  @UseGuards(ManagerAuthGuard)
  @Roles(Permissions.SuperAdmin, Permissions.GymOwner)
  @ApiOperation({ summary: 'Recurring vs One-Time income within window' })
  async getRecurringVsOnetime(
    @Param('gymId') gymId: string,
    @Query('start') start?: string,
    @Query('end') end?: string,
  ) {
    return this.gymService.getRecurringVsOnetime(gymId, start, end);
  }

  @Get('admin/analytics/revenue/forecast/:gymId')
  @UseGuards(ManagerAuthGuard)
  @Roles(Permissions.SuperAdmin, Permissions.GymOwner)
  @ApiOperation({ summary: 'Monthly revenue forecast based on recent trend' })
  async getRevenueForecast(
    @Param('gymId') gymId: string,
    @Query('start') start?: string,
    @Query('end') end?: string,
    @Query('horizonMonths') horizonMonths?: string,
  ) {
    const horizon = horizonMonths ? parseInt(horizonMonths) : 3;
    return this.gymService.getRevenueForecast(gymId, start, end, horizon);
  }

  @Patch('show-personal-trainers/:gymId')
  @UseGuards(ManagerAuthGuard)
  @ApiOperation({ summary: 'Update gym show personal trainers setting' })
  @ValidateGymRelatedToOwner()
  @Roles(Permissions.GymOwner)
  @ApiBody({ type: UpdateShowPersonalTrainersDto })
  updateShowPersonalTrainers(
    @Param('gymId') gymId: string,
    @Body() updateShowPersonalTrainersDto: UpdateShowPersonalTrainersDto,
  ) {
    return this.gymService.updateShowPersonalTrainers(
      gymId,
      updateShowPersonalTrainersDto.showPersonalTrainers,
    );
  }

  @Patch('allow-member-edit-training-program/:gymId')
  @UseGuards(ManagerAuthGuard)
  @ApiOperation({
    summary: 'Update gym allow member edit training program setting',
  })
  @ValidateGymRelatedToOwner()
  @Roles(Permissions.GymOwner)
  @ApiBody({ type: UpdateAllowMemberEditTrainingProgramDto })
  updateAllowMemberEditTrainingProgram(
    @Param('gymId') gymId: string,
    @Body()
    updateAllowMemberEditTrainingProgramDto: UpdateAllowMemberEditTrainingProgramDto,
  ) {
    return this.gymService.updateAllowMemberEditTrainingProgram(
      gymId,
      updateAllowMemberEditTrainingProgramDto.allowMemberEditTrainingProgram,
    );
  }

  @Patch('allow-user-signup/:gymId')
  @UseGuards(ManagerAuthGuard)
  @ApiOperation({ summary: 'Update gym allow user signup setting' })
  @ValidateGymRelatedToOwner()
  @Roles(Permissions.GymOwner)
  @ApiBody({ type: UpdateAllowUserSignupDto })
  updateAllowUserSignUp(
    @Param('gymId') gymId: string,
    @Body() updateAllowUserSignupDto: UpdateAllowUserSignupDto,
  ) {
    return this.gymService.updateAllowUserSignUp(
      gymId,
      updateAllowUserSignupDto.allowUserSignUp,
    );
  }

  @Patch('birthday-automation/:gymId')
  @UseGuards(ManagerAuthGuard)
  @ApiOperation({ summary: 'Update gym birthday automation settings' })
  @ValidateGymRelatedToOwner()
  @Roles(Permissions.GymOwner)
  @ApiBody({ type: UpdateBirthdayAutomationDto })
  updateBirthdayAutomation(
    @Param('gymId') gymId: string,
    @Body() updateBirthdayAutomationDto: UpdateBirthdayAutomationDto,
  ) {
    return this.gymService.updateBirthdayAutomationSettings(
      gymId,
      updateBirthdayAutomationDto,
    );
  }

  @Patch('session-time/:gymId')
  @UseGuards(ManagerAuthGuard)
  @ApiOperation({ summary: 'Update gym session time in hours (0.25 steps)' })
  @ValidateGymRelatedToOwner()
  @Roles(Permissions.GymOwner)
  @ApiBody({ type: UpdateSessionTimeDto })
  updateSessionTime(
    @Param('gymId') gymId: string,
    @Body() updateSessionTimeDto: UpdateSessionTimeDto,
  ) {
    return this.gymService.updateSessionTimeInHours(
      gymId,
      updateSessionTimeDto.sessionTimeInHours,
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
  @Roles(Permissions.GymOwner, Permissions.SuperAdmin)
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
  @Roles(Permissions.GymOwner, Permissions.SuperAdmin)
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
    return await this.gymService.setSubscriptionToGym({
      subscriptionTypeId: body.subscriptionTypeId,
      gymId: gymId,
      resetNotifications: body.resetNotifications,
      startDate: body.startDate,
      endDate: body.endDate,
    });
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

  @Patch('update/invoice-messages/:gymId')
  @UseGuards(ManagerAuthGuard)
  @ApiOperation({ summary: 'Update gym invoice messages status' })
  @ApiOkResponse({
    description: 'Invoice messages status updated successfully',
  })
  @Roles(Permissions.SuperAdmin)
  async updateInvoiceMessagesStatus(
    @Param('gymId') gymId: string,
    @Body() updateInvoiceMessagesDto: UpdateInvoiceMessagesDto,
  ) {
    return await this.gymService.updateInvoiceMessagesStatus(
      gymId,
      updateInvoiceMessagesDto.sendInvoiceMessages,
    );
  }

  @Patch('update/multi-subscription/:gymId')
  @UseGuards(ManagerAuthGuard)
  @ApiOperation({ summary: 'Update gym multi-subscription feature status' })
  @ApiOkResponse({
    description: 'Multi-subscription status updated successfully',
  })
  @Roles(Permissions.SuperAdmin)
  async updateMultiSubscriptionStatus(
    @Param('gymId') gymId: string,
    @Body() updateMultiSubscriptionDto: UpdateMultiSubscriptionDto,
  ) {
    return await this.gymService.updateMultiSubscriptionStatus(
      gymId,
      updateMultiSubscriptionDto.enableMultiSubscription,
    );
  }

  @Patch('update/message-language/:gymId')
  @UseGuards(ManagerAuthGuard)
  @Roles(Permissions.GymOwner)
  @ApiOperation({ summary: 'Update gym message language' })
  @ApiOkResponse({ description: 'Message language updated successfully' })
  @ValidateGymRelatedToOwner()
  async updateMessageLanguage(
    @Param('gymId') gymId: string,
    @Body() updateMessageLanguageDto: UpdateMessageLanguageDto,
  ) {
    return await this.gymService.updateMessageLanguage(
      gymId,
      updateMessageLanguageDto.messagesLanguage,
    );
  }

  @Patch('update/description/:gymId')
  @UseGuards(ManagerAuthGuard)
  @ApiOperation({ summary: 'Update gym description' })
  @ApiOkResponse({ description: 'Gym description updated successfully' })
  @ValidateGymRelatedToOwner()
  @Roles(Permissions.GymOwner)
  @ApiBody({ type: UpdateGymDescriptionDto })
  async updateGymDescription(
    @Param('gymId') gymId: string,
    @Body() updateGymDescriptionDto: UpdateGymDescriptionDto,
  ) {
    return await this.gymService.updateGymDescription(
      gymId,
      updateGymDescriptionDto.description,
    );
  }

  @Patch('update/welcome-message-automation/:gymId')
  @UseGuards(ManagerAuthGuard)
  @ApiOperation({ summary: 'Toggle automatic welcome message sending' })
  @ApiOkResponse({
    description: 'Welcome message automation status updated successfully',
  })
  @ValidateGymRelatedToOwner()
  @Roles(Permissions.GymOwner)
  @ApiBody({ type: UpdateWelcomeMessageAutomationDto })
  async updateWelcomeMessageAutomation(
    @Param('gymId') gymId: string,
    @Body()
    updateWelcomeMessageAutomationDto: UpdateWelcomeMessageAutomationDto,
  ) {
    return await this.gymService.updateWelcomeMessageAutomation(
      gymId,
      updateWelcomeMessageAutomationDto.sendWelcomeMessageAutomatically,
    );
  }

  @Patch('update/phone/:gymId')
  @UseGuards(ManagerAuthGuard)
  @ApiOperation({ summary: 'Update gym phone number' })
  @ApiOkResponse({ description: 'Gym phone number updated successfully' })
  @ValidateGymRelatedToOwner()
  @Roles(Permissions.GymOwner)
  async updateGymPhone(
    @Param('gymId') gymId: string,
    @Body() updateGymPhoneDto: UpdateGymPhoneDto,
  ) {
    return await this.gymService.updateGymPhone(
      gymId,
      updateGymPhoneDto.phoneNumber,
      updateGymPhoneDto.phoneNumberISOCode,
    );
  }

  @Get('has-multiple-gyms')
  @UseGuards(ManagerAuthGuard)
  @ApiOperation({
    summary: 'Check if current manager has multiple gyms (owned or assigned)',
  })
  @ApiOkResponse({
    description: 'Returns whether the manager has multiple gyms',
    schema: {
      type: 'object',
      properties: {
        hasMultipleGyms: { type: 'boolean' },
      },
    },
  })
  @Roles(Permissions.Any)
  async hasMultipleGyms(@User() user: ManagerEntity) {
    return await this.gymService.hasMultipleGyms(user);
  }

  @Get('get-owner-gyms/:gymId')
  @UseGuards(ManagerAuthGuard)
  @ApiOperation({
    summary: 'Get all gyms belonging to the owner of the specified gym',
  })
  @ApiOkResponse({
    description: 'Returns all gyms for the owner of the specified gym',
    type: [GymEntity],
  })
  @Roles(Permissions.GymOwner, Permissions.products)
  @ValidateGymRelatedToOwner()
  async getOwnerGyms(@Param('gymId') gymId: string) {
    return await this.gymService.getOwnerGyms(gymId);
  }

  @Patch('update/monthly-reminder/:gymId')
  @UseGuards(ManagerAuthGuard)
  @ApiOperation({ summary: 'Update monthly reminder setting' })
  @ValidateGymRelatedToOwner()
  @Roles(Permissions.GymOwner, Permissions.SuperAdmin)
  @ApiOkResponse({ type: SuccessMessageReturn })
  @ApiBadRequestResponse()
  @ApiUnauthorizedResponse()
  updateMonthlyReminder(
    @Param('gymId') gymId: string,
    @Body() updateMonthlyReminderDto: UpdateMonthlyReminderDto,
  ) {
    return this.gymService.updateMonthlyReminder(
      gymId,
      updateMonthlyReminderDto.sendMonthlyReminder,
      updateMonthlyReminderDto.monthlyReminderType,
      updateMonthlyReminderDto.monthlyReminderDays,
    );
  }

  @Patch('update/manual-messages/:gymId')
  @UseGuards(ManagerAuthGuard)
  @ApiOperation({
    summary: 'Update manual messages permission (Super Admin only)',
  })
  @Roles(Permissions.SuperAdmin)
  @ApiOkResponse({ type: SuccessMessageReturn })
  @ApiBadRequestResponse()
  @ApiUnauthorizedResponse()
  updateManualMessages(
    @Param('gymId') gymId: string,
    @Body() updateManualMessagesDto: UpdateManualMessagesDto,
  ) {
    return this.gymService.updateManualMessages(
      gymId,
      updateManualMessagesDto.allowManualMessages,
    );
  }

  @Patch('update/allow-duplicate-member-phones/:gymId')
  @UseGuards(ManagerAuthGuard)
  @ApiOperation({
    summary: 'Update policy of allowing duplicate member phone numbers',
  })
  @ApiOkResponse({ type: SuccessMessageReturn })
  @ApiBadRequestResponse()
  @ApiUnauthorizedResponse()
  @Roles(Permissions.SuperAdmin)
  updateAllowDuplicateMemberPhones(
    @Param('gymId') gymId: string,
    @Body() body: UpdateAllowDuplicateMemberPhonesDto,
  ) {
    return this.gymService.updateAllowDuplicateMemberPhones(
      gymId,
      body.allowDuplicateMemberPhoneNumbers,
    );
  }

  @Patch('update/allow-user-without-phone/:gymId')
  @UseGuards(ManagerAuthGuard)
  @ApiOperation({
    summary: 'Allow creating members without phone numbers',
  })
  @ApiOkResponse({ type: SuccessMessageReturn })
  @ApiBadRequestResponse()
  @ApiUnauthorizedResponse()
  @Roles(Permissions.SuperAdmin)
  updateAllowUserWithoutPhoneNumber(
    @Param('gymId') gymId: string,
    @Body() body: UpdateAllowUserWithoutPhoneNumberDto,
  ) {
    return this.gymService.updateAllowUserWithoutPhoneNumber(
      gymId,
      body.allowUserWithoutPhoneNumber,
    );
  }

  @Patch('allow-members-set-pt-times/:gymId')
  @UseGuards(ManagerAuthGuard)
  @ApiOperation({ summary: 'Update gym allow members set PT times setting' })
  @ValidateGymRelatedToOwner()
  @Roles(Permissions.GymOwner, Permissions.SuperAdmin)
  @ApiBody({ type: UpdateAllowMembersSetPtTimesDto })
  @ApiOkResponse({ type: SuccessMessageReturn })
  @ApiBadRequestResponse()
  @ApiUnauthorizedResponse()
  updateAllowMembersSetPtTimes(
    @Param('gymId') gymId: string,
    @Body() body: UpdateAllowMembersSetPtTimesDto,
  ) {
    return this.gymService.updateAllowMembersSetPtTimes(
      gymId,
      body.allowMembersSetPtTimes,
    );
  }

  @Get('transactions/export/:gymId')
  @UseGuards(ManagerAuthGuard)
  @ApiOperation({ summary: 'Export transactions to Excel' })
  @ValidateGymRelatedToOwner()
  @Roles(Permissions.GymOwner, Permissions.transactions)
  async exportTransactions(
    @User() user: ManagerEntity,
    @Param('gymId') gymId: string,
    @Res() res: Response,
    @Query('search') search?: string,
    @Query('type') type?: TransactionType,
    @Query('status') status?: PaymentStatus,
  ) {
    const { buffer, filename } = await this.gymService.exportTransactionsXlsx(
      user,
      gymId,
      search,
      type,
      status,
    );
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.end(buffer);
  }
}
