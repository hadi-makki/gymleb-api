import { Controller, Delete, Param, UseGuards } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
} from '../error/api-responses.decorator';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { ManagerAuthGuard } from '../guards/manager-auth.guard';
import { Roles } from '../decorators/roles/Role';
import { Role } from '../decorators/roles/role.enum';
import { TransactionService } from './subscription-instance.service';
import { SuccessMessageReturn } from '../main-classes/success-message-return';
import { Manager } from '../manager/manager.entity';
import { User } from '../decorators/users.decorator';

@Controller('transactions')
@ApiTags('Transactions')
export class TransactionController {
  constructor(private readonly service: TransactionService) {}

  @Delete(':id')
  @UseGuards(ManagerAuthGuard)
  @ApiBearerAuth()
  @ApiBadRequestResponse()
  @ApiUnauthorizedResponse()
  @ApiOkResponse({ type: SuccessMessageReturn })
  @Roles(Role.SuperAdmin, Role.GymOwner)
  async delete(@Param('id') id: string, @User() manager: Manager) {
    return this.service.deleteSubscriptionInstance(id, manager);
  }
}
