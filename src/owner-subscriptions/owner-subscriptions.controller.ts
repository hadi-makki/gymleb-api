import {
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
import { OwnerSubscriptionsService } from './owner-subscriptions.service';
import {
  CreateOwnerSubscriptionTypeDto,
  AssignOwnerSubscriptionDto,
} from './dto';
import { Roles } from '../decorators/roles/Role';
import { Permissions } from '../decorators/roles/role.enum';
import { ManagerAuthGuard } from '../guards/manager-auth.guard';
import { User } from '../decorators/users.decorator';
import { ManagerEntity } from 'src/manager/manager.entity';

@Controller('owner-subscriptions')
@UseGuards(ManagerAuthGuard)
export class OwnerSubscriptionsController {
  constructor(private service: OwnerSubscriptionsService) {}

  @Post('types')
  @Roles(Permissions.SuperAdmin)
  createType(@Body() dto: CreateOwnerSubscriptionTypeDto) {
    return this.service.createType(dto);
  }

  @Get('types')
  @Roles(Permissions.SuperAdmin, Permissions.GymOwner)
  listTypes() {
    return this.service.listTypes();
  }

  @Post('assign')
  @Roles(Permissions.SuperAdmin)
  assign(@Body() dto: AssignOwnerSubscriptionDto) {
    return this.service.assign(dto);
  }

  @Get('me')
  @Roles(Permissions.Any)
  getMy(@User() user: ManagerEntity, @Query('gymId') gymId: string) {
    return this.service.getOwnerSubscription(gymId);
  }

  @Delete(':id')
  @Roles(Permissions.SuperAdmin)
  deleteType(@Param('id') id: string) {
    return this.service.deleteType(id);
  }

  @Patch(':id')
  @Roles(Permissions.SuperAdmin)
  updateType(
    @Param('id') id: string,
    @Body() dto: CreateOwnerSubscriptionTypeDto,
  ) {
    return this.service.updateType(id, dto);
  }
}
