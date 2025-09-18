import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Convert } from 'easy-currencies';
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
import { TransactionService } from './transaction.service';
import { ValidateGymRelatedToOwner } from 'src/decorators/validate-gym-related-to-owner.decorator';

@Controller('transactions')
@ApiTags('Transactions')
export class TransactionController {
  constructor(private readonly service: TransactionService) {}

  @Delete(':gymId/:id')
  @UseGuards(ManagerAuthGuard)
  @ApiBearerAuth()
  @ApiBadRequestResponse()
  @ApiUnauthorizedResponse()
  @ApiOkResponse({ type: SuccessMessageReturn })
  @Roles(Permissions.SuperAdmin, Permissions.GymOwner, Permissions.transactions)
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
  @Roles(Permissions.SuperAdmin, Permissions.GymOwner, Permissions.transactions)
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
  @Roles(Permissions.SuperAdmin, Permissions.GymOwner, Permissions.transactions)
  async updatePaymentStatus(
    @Param('id') id: string,
    @User() manager: ManagerEntity,
    @Param('gymId') gymId: string,
    @Body() body: { isPaid: boolean },
  ) {
    return this.service.updateTransactionPaymentStatus(
      id,
      manager,
      gymId,
      body.isPaid,
    );
  }

  @Patch(':gymId/pt-session/:sessionId/payment-status')
  @UseGuards(ManagerAuthGuard)
  @ApiBearerAuth()
  @ApiBadRequestResponse()
  @ApiUnauthorizedResponse()
  @ApiOkResponse({ type: SuccessMessageReturn })
  @Roles(Permissions.SuperAdmin, Permissions.GymOwner, Permissions.transactions)
  async togglePtSessionPayment(
    @Param('sessionId') sessionId: string,
    @Param('gymId') gymId: string,
    @Body() body: { isPaid: boolean },
  ) {
    return this.service.togglePtSessionTransactionsPayment(
      sessionId,
      gymId,
      body.isPaid,
    );
  }

  @Get('currency-exchange')
  @ApiBearerAuth()
  @ApiOkResponse({ type: SuccessMessageReturn })
  @Roles(Permissions.SuperAdmin, Permissions.GymOwner, Permissions.transactions)
  async currencyExchange() {
    const convert = await Convert().from('USD').fetch();
    console.log(await convert.amount(1).to('LBP'));
  }
}
