import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
  Query,
  Headers,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Convert } from 'easy-currencies';
import { ValidateGymRelatedToManagerOrManagerInGym } from 'src/decorators/validate-gym-related-to-manager-or-manager-in-gym.dto';
import { ValidateGymRelatedToOwner } from 'src/decorators/validate-gym-related-to-owner.decorator';
import { ValidateMemberRelatedToGym } from 'src/decorators/validate-member-related-to-gym.decorator';
import { ManagerEntity } from 'src/manager/manager.entity';
import { Roles } from '../decorators/roles/Role';
import { Permissions } from '../decorators/roles/role.enum';
import { User } from '../decorators/users.decorator';
import {
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
} from '../error/api-responses.decorator';
import { ManagerAuthGuard } from '../guards/manager-auth.guard';
import { SuccessMessageReturn } from '../main-classes/success-message-return';
import { PaymentStatus } from './transaction.entity';
import { TransactionService } from './transaction.service';
import { Currency } from 'src/common/enums/currency.enum';

@Controller('transactions')
@ApiTags('Transactions')
export class TransactionController {
  constructor(private readonly service: TransactionService) {}

  @Get(':gymId/today/paginated')
  @UseGuards(ManagerAuthGuard)
  @ApiBearerAuth()
  @ApiBadRequestResponse()
  @ApiUnauthorizedResponse()
  @ApiOkResponse({ type: SuccessMessageReturn })
  @Roles(
    Permissions.SuperAdmin,
    Permissions.GymOwner,
    Permissions.read_transactions,
  )
  @ValidateGymRelatedToManagerOrManagerInGym()
  async getTodayTransactionsPaginated(
    @Param('gymId') gymId: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Headers('currency') currency: Currency = Currency.USD,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const pageNum = Math.max(1, parseInt(page as any, 10) || 1);
    const limitNum = Math.max(
      1,
      Math.min(100, parseInt(limit as any, 10) || 10),
    );
    return this.service.getTodayPaidTransactionsForGymPaginated(
      gymId,
      pageNum,
      limitNum,
      currency,
      startDate,
      endDate,
    );
  }

  @Delete(':gymId/:id')
  @UseGuards(ManagerAuthGuard)
  @ApiBearerAuth()
  @ApiBadRequestResponse()
  @ApiUnauthorizedResponse()
  @ApiOkResponse({ type: SuccessMessageReturn })
  @Roles(
    Permissions.SuperAdmin,
    Permissions.GymOwner,
    Permissions.delete_transactions,
  )
  async delete(
    @Param('id') id: string,
    @User() manager: ManagerEntity,
    @Param('gymId') gymId: string,
  ) {
    return this.service.deleteSubscriptionInstance(id, manager, gymId);
  }

  @Delete('/delete/bulk/:gymId')
  @UseGuards(ManagerAuthGuard)
  @ApiBearerAuth()
  @ApiBadRequestResponse()
  @ApiUnauthorizedResponse()
  @ValidateGymRelatedToOwner()
  @ApiOkResponse({ type: SuccessMessageReturn })
  @Roles(
    Permissions.SuperAdmin,
    Permissions.GymOwner,
    Permissions.delete_transactions,
  )
  async bulkDelete(
    @Param('gymId') gymId: string,
    @User() manager: ManagerEntity,
    @Body() body: { ids: string[] },
  ) {
    return this.service.bulkDeleteSubscriptionInstances(
      body.ids,
      manager,
      gymId,
    );
  }

  @Patch(':gymId/:id/payment-status')
  @UseGuards(ManagerAuthGuard)
  @ApiBearerAuth()
  @ApiBadRequestResponse()
  @ApiUnauthorizedResponse()
  @ApiOkResponse({ type: SuccessMessageReturn })
  @Roles(
    Permissions.SuperAdmin,
    Permissions.GymOwner,
    Permissions.update_transactions,
  )
  async updatePaymentStatus(
    @Param('id') id: string,
    @User() manager: ManagerEntity,
    @Param('gymId') gymId: string,
    @Body() body: { status: PaymentStatus },
  ) {
    return this.service.updateTransactionPaymentStatus(
      id,
      manager,
      gymId,
      body.status,
    );
  }

  @Patch(':gymId/:id/toggle-payment')
  @UseGuards(ManagerAuthGuard)
  @ApiBearerAuth()
  @ApiBadRequestResponse()
  @ApiUnauthorizedResponse()
  @ApiOkResponse({ type: SuccessMessageReturn })
  @Roles(
    Permissions.SuperAdmin,
    Permissions.GymOwner,
    Permissions.update_transactions,
  )
  async togglePayment(
    @Param('id') id: string,
    @User() manager: ManagerEntity,
    @Param('gymId') gymId: string,
  ) {
    return this.service.toggleTransactionPaymentStatus(id, manager, gymId);
  }

  @Patch(':gymId/pt-session/:sessionId/payment-status')
  @UseGuards(ManagerAuthGuard)
  @ApiBearerAuth()
  @ApiBadRequestResponse()
  @ApiUnauthorizedResponse()
  @ApiOkResponse({ type: SuccessMessageReturn })
  @Roles(
    Permissions.SuperAdmin,
    Permissions.GymOwner,
    Permissions.update_transactions,
  )
  async togglePtSessionPayment(
    @Param('sessionId') sessionId: string,
    @Param('gymId') gymId: string,
    @Body() body: { status: PaymentStatus },
  ) {
    return this.service.togglePtSessionTransactionsPayment(
      sessionId,
      gymId,
      body.status,
    );
  }

  @Get('currency-exchange')
  @ApiBearerAuth()
  @ApiOkResponse({ type: SuccessMessageReturn })
  @Roles(
    Permissions.SuperAdmin,
    Permissions.GymOwner,
    Permissions.read_transactions,
  )
  async currencyExchange() {
    const convert = await Convert().from('USD').fetch();
    console.log(await convert.amount(1).to('LBP'));
  }

  @Post('update-paid-amount/:gymId/:memberId/:transactionId')
  @UseGuards(ManagerAuthGuard)
  @ApiBearerAuth()
  @ApiBadRequestResponse()
  @ApiUnauthorizedResponse()
  @ApiOkResponse({ type: SuccessMessageReturn })
  @Roles(
    Permissions.SuperAdmin,
    Permissions.GymOwner,
    Permissions.update_transactions,
  )
  @ValidateGymRelatedToManagerOrManagerInGym()
  @ValidateMemberRelatedToGym()
  async updatePaidAmount(
    @Param('transactionId') transactionId: string,
    @Body() body: { paidAmount: number },
  ) {
    return this.service.updatePaidAmount(transactionId, body.paidAmount);
  }

  @Post('complete-payment/:gymId/:memberId/:transactionId')
  @UseGuards(ManagerAuthGuard)
  @ApiBearerAuth()
  @ApiBadRequestResponse()
  @ApiUnauthorizedResponse()
  @ApiOkResponse({ type: SuccessMessageReturn })
  @Roles(
    Permissions.SuperAdmin,
    Permissions.GymOwner,
    Permissions.update_transactions,
  )
  @ValidateGymRelatedToManagerOrManagerInGym()
  @ValidateMemberRelatedToGym()
  async completePayment(@Param('transactionId') transactionId: string) {
    return this.service.completePayment(transactionId);
  }
}
