import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Roles } from '../decorators/roles/Role';
import { Role } from '../decorators/roles/role.enum';
import { User } from '../decorators/users.decorator';
import { ManagerAuthGuard } from '../guards/manager-auth.guard';
import { Manager } from '../manager/manager.entity';
import { CreateTwilioDto } from './dto/create-twilio.dto';
import { TwilioService } from './twilio.service';

@Controller('notifications')
export class TwilioController {
  constructor(private readonly twilioService: TwilioService) {}

  @Post()
  async create(@Body() createTwilioDto: CreateTwilioDto) {
    const phoneNumber = '+96178886897';
    return await this.twilioService.sendWhatsappMessage(phoneNumber);
  }

  @Post('notify-expired-members')
  @UseGuards(ManagerAuthGuard)
  @ApiOperation({ summary: 'Notify expired members' })
  @ApiBearerAuth()
  @Roles(Role.GymOwner)
  async notifyExpiredMembers(@User() manager: Manager) {
    return await this.twilioService.notifyExpiredMembers(manager);
  }

  @Post('notify-single-member/:userId')
  @UseGuards(ManagerAuthGuard)
  @ApiOperation({ summary: 'Notify single member' })
  @ApiBearerAuth()
  @Roles(Role.GymOwner)
  async notifySingleMember(
    @User() manager: Manager,
    @Param('userId') userId: string,
  ) {
    return await this.twilioService.notifySingleMember(manager, userId);
  }
}
