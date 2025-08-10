import { Controller, Delete, Param, UseGuards } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
} from '../error/api-responses.decorator';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { ManagerAuthGuard } from '../guards/manager-auth.guard';
import { Roles } from '../decorators/roles/Role';
import { Role } from '../decorators/roles/role.enum';
import { SubscriptionInstanceService } from './subscription-instance.service';
import { SuccessMessageReturn } from '../main-classes/success-message-return';
import { Manager } from 'src/manager/manager.entity';
import { User } from 'src/decorators/users.decorator';

@Controller('transactions')
@ApiTags('Transactions')
export class SubscriptionInstanceController {
  constructor(private readonly service: SubscriptionInstanceService) {}

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
