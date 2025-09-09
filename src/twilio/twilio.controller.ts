import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Roles } from '../decorators/roles/Role';
import { Permissions } from '../decorators/roles/role.enum';
import { User } from '../decorators/users.decorator';
import { ManagerAuthGuard } from '../guards/manager-auth.guard';
import { ManagerEntity } from '../manager/manager.entity';
import { CreateTwilioDto } from './dto/create-twilio.dto';
import { TwilioService } from './twilio.service';

@Controller('notifications')
export class TwilioController {
  constructor(private readonly twilioService: TwilioService) {}

  @Post()
  async create(@Body() createTwilioDto: CreateTwilioDto) {
    const phoneNumber = '+96178886897';
    const gymId = '01cfdc43-507b-4ce6-a39a-373cf89cccfd';
    return await this.twilioService.testWhatsappMessage(
      phoneNumber,
      gymId,
      'gymPaymentConfirmation',
    );
  }

  @Post('test-message/:gymId')
  @UseGuards(ManagerAuthGuard)
  @ApiOperation({ summary: 'Test WhatsApp message with different types' })
  @ApiBearerAuth()
  @Roles(Permissions.GymOwner)
  async testMessage(
    @Param('gymId') gymId: string,
    @Body()
    body: {
      phoneNumber: string;
      messageType:
        | 'expiaryReminder'
        | 'welcomeMessage'
        | 'welcomeMessageCalisthenics';
    },
  ) {
    return await this.twilioService.testWhatsappMessage(
      body.phoneNumber,
      gymId,
      body.messageType,
    );
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

  // @Post('notify-single-member/:gymId/:userId')
  // @UseGuards(ManagerAuthGuard)
  // @ApiOperation({ summary: 'Notify single member' })
  // @ApiBearerAuth()
  // @Roles(Permissions.GymOwner)
  // async notifySingleMember(
  //   @User() manager: ManagerEntity,
  //   @Param('userId') userId: string,
  //   @Param('gymId') gymId: string,
  // ) {
  //   return await this.twilioService.notifySingleMember(userId, gymId);
  // }

  @Get('inbound-messages')
  @ApiOperation({ summary: 'Get inbound messages' })
  @ApiBearerAuth()
  @UseGuards(ManagerAuthGuard)
  @Roles(Permissions.SuperAdmin)
  async getInboundMessages() {
    return await this.twilioService.getInboundMessages();
  }

  @Get('messages')
  @ApiOperation({ summary: 'Get all Twilio messages with pagination' })
  @ApiBearerAuth()
  @UseGuards(ManagerAuthGuard)
  @Roles(Permissions.SuperAdmin)
  async getAllMessages(
    @Query('page') page = '1',
    @Query('limit') limit = '10',
    @Query('search') search?: string,
    @Query('gymId') gymId?: string,
  ) {
    return await this.twilioService.getAllMessages(
      Number(limit),
      Number(page),
      search || '',
      gymId,
    );
  }

  @Get('messages/gym/:gymId')
  @ApiOperation({ summary: 'Get Twilio messages for a specific gym' })
  @ApiBearerAuth()
  @UseGuards(ManagerAuthGuard)
  @Roles(Permissions.SuperAdmin)
  async getGymMessages(
    @Param('gymId') gymId: string,
    @Query('page') page = '1',
    @Query('limit') limit = '10',
    @Query('search') search?: string,
  ) {
    return await this.twilioService.getGymMessages(
      gymId,
      Number(limit),
      Number(page),
      search || '',
    );
  }
}
