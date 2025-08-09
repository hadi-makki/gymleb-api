import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { OwnerSubscriptionsService } from './owner-subscriptions.service';
import {
  CreateOwnerSubscriptionTypeDto,
  AssignOwnerSubscriptionDto,
} from './dto';
import { Roles } from '../decorators/roles/Role';
import { Role } from '../decorators/roles/role.enum';
import { ManagerAuthGuard } from '../guards/manager-auth.guard';
import { User } from '../decorators/users.decorator';
import { Manager } from '../manager/manager.entity';

@Controller('owner-subscriptions')
@UseGuards(ManagerAuthGuard)
export class OwnerSubscriptionsController {
  constructor(private service: OwnerSubscriptionsService) {}

  @Post('types')
  @Roles(Role.SuperAdmin)
  createType(@Body() dto: CreateOwnerSubscriptionTypeDto) {
    return this.service.createType(dto);
  }

  @Get('types')
  @Roles(Role.SuperAdmin)
  listTypes() {
    return this.service.listTypes();
  }

  @Post('assign')
  @Roles(Role.SuperAdmin)
  assign(@Body() dto: AssignOwnerSubscriptionDto) {
    return this.service.assign(dto);
  }

  @Get('me')
  @Roles(Role.GymOwner)
  getMy(@User() user: Manager) {
    return this.service.getOwnerSubscription(user.id);
  }

  @Delete(':id')
  @Roles(Role.SuperAdmin)
  deleteType(@Param('id') id: string) {
    return this.service.deleteType(id);
  }

  @Patch(':id')
  @Roles(Role.SuperAdmin)
  updateType(
    @Param('id') id: string,
    @Body() dto: CreateOwnerSubscriptionTypeDto,
  ) {
    return this.service.updateType(id, dto);
  }
}
