import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Roles } from '../decorators/roles/Role';
import { Permissions } from '../decorators/roles/role.enum';
import { User } from '../decorators/users.decorator';
import { ManagerAuthGuard } from '../guards/manager-auth.guard';
import { Manager } from '../manager/manager.model';
import { CreateTwilioDto } from './dto/create-twilio.dto';
import { TwilioService } from './twilio.service';
import { ManagerEntity } from 'src/manager/manager.entity';

@Controller('notifications')
export class TwilioController {
  constructor(private readonly twilioService: TwilioService) {}

  @Post()
  async create(@Body() createTwilioDto: CreateTwilioDto) {
    const phoneNumber = '+96178886897';
    return await this.twilioService.sendWhatsappMessage(phoneNumber);
  }

  @Post('notify-expired-members/:gymId')
  @UseGuards(ManagerAuthGuard)
  @ApiOperation({ summary: 'Notify expired members' })
  @ApiBearerAuth()
  @Roles(Permissions.GymOwner)
  async notifyExpiredMembers(
    @User() manager: ManagerEntity,
    @Param('gymId') gymId: string,
  ) {
    return await this.twilioService.notifyExpiredMembers(manager, gymId);
  }

  @Post('notify-single-member/:gymId/:userId')
  @UseGuards(ManagerAuthGuard)
  @ApiOperation({ summary: 'Notify single member' })
  @ApiBearerAuth()
  @Roles(Permissions.GymOwner)
  async notifySingleMember(
    @User() manager: Manager,
    @Param('userId') userId: string,
    @Param('gymId') gymId: string,
  ) {
    return await this.twilioService.notifySingleMember(userId, gymId);
  }

  @Get('inbound-messages')
  @ApiOperation({ summary: 'Get inbound messages' })
  @ApiBearerAuth()
  @UseGuards(ManagerAuthGuard)
  @Roles(Permissions.SuperAdmin)
  async getInboundMessages() {
    return await this.twilioService.getInboundMessages();
  }
}
