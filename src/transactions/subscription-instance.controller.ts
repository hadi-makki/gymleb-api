import { Controller, Delete, Get, Param, UseGuards } from '@nestjs/common';
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
import { TransactionService } from './subscription-instance.service';

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

  @Get('currency-exchange')
  @ApiBearerAuth()
  @ApiOkResponse({ type: SuccessMessageReturn })
  @Roles(Permissions.SuperAdmin, Permissions.GymOwner, Permissions.transactions)
  async currencyExchange() {
    const convert = await Convert().from('USD').fetch();
    console.log(await convert.amount(1).to('LBP'));
  }
}
