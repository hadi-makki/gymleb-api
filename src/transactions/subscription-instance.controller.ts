import { Controller, Delete, Get, Param, UseGuards } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
} from '../error/api-responses.decorator';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { ManagerAuthGuard } from '../guards/manager-auth.guard';
import { Roles } from '../decorators/roles/Role';
import { Permissions } from '../decorators/roles/role.enum';
import { TransactionService } from './subscription-instance.service';
import { SuccessMessageReturn } from '../main-classes/success-message-return';
import { Manager } from '../manager/manager.entity';
import { User } from '../decorators/users.decorator';
import { Convert } from 'easy-currencies';

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
    @User() manager: Manager,
    @Param('gymId') gymId: string,
  ) {
    return this.service.deleteSubscriptionInstance(id, manager, gymId);
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
