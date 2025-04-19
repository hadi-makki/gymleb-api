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
import { ManagerAuthGuard } from 'src/guards/manager-auth.guard';
import { Roles } from 'src/decorators/roles/Role';
import { Role } from 'src/decorators/roles/role.enum';
import { Manager } from 'src/manager/manager.entity';
import { User } from 'src/decorators/users.decorator';

@Controller('subscription')
@Roles(Role.GymOwner)
@UseGuards(ManagerAuthGuard)
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @Post()
  async create(
    @Body() createSubscriptionDto: CreateSubscriptionDto,
    @User() manager: Manager,
  ) {
    return await this.subscriptionService.create(
      createSubscriptionDto,
      manager,
    );
  }

  @Get()
  async findAll() {
    return await this.subscriptionService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.subscriptionService.findOne(id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateSubscriptionDto: UpdateSubscriptionDto,
  ) {
    return await this.subscriptionService.update(id, updateSubscriptionDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return await this.subscriptionService.remove(id);
  }

  @Get('types')
  async getSubscriptionTypes() {
    return await this.subscriptionService.getSubscriptionTypes();
  }
}
