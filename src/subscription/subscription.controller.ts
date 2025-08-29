import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { SubscriptionService } from './subscription.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';
import { ManagerAuthGuard } from '../guards/manager-auth.guard';
import { Roles } from '../decorators/roles/Role';
import { Permissions } from '../decorators/roles/role.enum';
import { User } from '../decorators/users.decorator';
import { ManagerEntity } from 'src/manager/manager.entity';

@Controller('subscription')
@UseGuards(ManagerAuthGuard)
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @Post('create/:gymId')
  @Roles(Permissions.GymOwner, Permissions.subscriptions)
  async create(
    @Body() createSubscriptionDto: CreateSubscriptionDto,
    @User() manager: ManagerEntity,
    @Param('gymId') gymId: string,
  ) {
    return await this.subscriptionService.create(
      createSubscriptionDto,
      manager,
      gymId,
    );
  }

  @Get('/gym/:gymId')
  @Roles(Permissions.Any)
  async findAll(@Param('gymId') gymId: string) {
    return await this.subscriptionService.findAll(gymId);
  }

  @Get('/get-one/:id')
  @Roles(Permissions.Any)
  async findOne(@Param('id') id: string) {
    return await this.subscriptionService.findOne(id);
  }

  @Patch(':gymId/:id')
  @Roles(Permissions.GymOwner, Permissions.subscriptions)
  async update(
    @Param('id') id: string,
    @Body() updateSubscriptionDto: UpdateSubscriptionDto,
    @Param('gymId') gymId: string,
  ) {
    return await this.subscriptionService.update(
      id,
      updateSubscriptionDto,
      gymId,
    );
  }

  @Delete(':gymId/:id')
  @Roles(Permissions.GymOwner, Permissions.subscriptions)
  async remove(@Param('id') id: string, @Param('gymId') gymId: string) {
    return await this.subscriptionService.remove(id, gymId);
  }

  @Get('types')
  @Roles(Permissions.Any)
  async getSubscriptionTypes() {
    return await this.subscriptionService.getSubscriptionTypes();
  }

  @Delete('delete/subscription-instance/:gymId/:id')
  @Roles(Permissions.GymOwner, Permissions.subscriptions)
  async deleteSubscriptionInstance(
    @Param('id') id: string,
    @User() manager: ManagerEntity,
    @Param('gymId') gymId: string,
  ) {
    return await this.subscriptionService.deleteSubscriptionInstance(
      id,
      manager,
      gymId,
    );
  }
}
