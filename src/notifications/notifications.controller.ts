import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Patch,
  Delete,
  Param,
  Query,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiBearerAuth,
  ApiCreatedResponse,
} from '@nestjs/swagger';
import { Paginate, PaginateQuery } from 'nestjs-paginate';
import { NotificationsService } from './notifications.service';
import { RegisterExpoTokenDto } from './dto/register-expo-token.dto';
import {
  SendExpoNotificationDto,
  SendBulkExpoNotificationDto,
} from './dto/send-notification.dto';
import { GetNotificationsDto } from './dto/get-notifications.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { AuthGuard } from '../guards/auth.guard';
import { ManagerAuthGuard } from '../guards/manager-auth.guard';
import { GetDeviceId } from '../decorators/get-device-id.decorator';
import { Roles } from '../decorators/roles/Role';
import { Permissions } from '../decorators/roles/role.enum';
import { ApiBadRequestResponse } from 'src/error/api-responses.decorator';
import { User } from '../decorators/users.decorator';
import { MemberEntity } from '../member/entities/member.entity';
import { ManagerEntity } from '../manager/manager.entity';
import { NotificationRecipientType } from './entities/in-app-notification.entity';

@ApiTags('Notifications')
@Controller('notifications')
@ApiBearerAuth()
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post('register-token')
  @UseGuards(AuthGuard)
  @ApiOperation({
    summary: 'Register Expo push token for the authenticated user',
    description:
      "Registers or updates the Expo push notification token for the authenticated user's device. This token is stored in TokenEntity linked by deviceId.",
  })
  @ApiCreatedResponse({
    description: 'Expo token registered successfully',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Expo token registered successfully',
        },
        success: { type: 'boolean', example: true },
      },
    },
  })
  @ApiBadRequestResponse('Invalid token or platform')
  async registerExpoToken(
    @GetDeviceId() deviceId: string,
    @Body() registerExpoTokenDto: RegisterExpoTokenDto,
  ) {
    return await this.notificationsService.registerExpoToken(
      deviceId,
      registerExpoTokenDto,
    );
  }

  @Post('unregister-token')
  @UseGuards(AuthGuard)
  @ApiOperation({
    summary: 'Unregister Expo push token for the authenticated user',
    description:
      "Unregisters the Expo push notification token for the authenticated user's device.",
  })
  @ApiCreatedResponse({
    description: 'Expo token unregistered successfully',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Expo token unregistered successfully',
        },
        success: { type: 'boolean', example: true },
      },
    },
  })
  async unregisterExpoToken(@GetDeviceId() deviceId: string) {
    return await this.notificationsService.unregisterExpoToken(deviceId);
  }

  @Post('send')
  //   @UseGuards(AuthGuard)
  @ApiOperation({
    summary: 'Send a push notification via Expo Push API',
    description:
      'Sends a push notification to a single device using Expo Push Notification Service.',
  })
  @ApiResponse({
    status: 200,
    description: 'Notification sent successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        ticketId: { type: 'string', nullable: true },
        status: { type: 'string', enum: ['ok', 'error'] },
        error: { type: 'string', nullable: true },
        message: { type: 'string', nullable: true },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid request',
  })
  async sendNotification(@Body() dto: SendExpoNotificationDto) {
    return this.notificationsService.sendNotification(dto);
  }

  @Post('send-bulk')
  @UseGuards(ManagerAuthGuard)
  @Roles(Permissions.GymOwner, Permissions.update_members)
  @ApiOperation({
    summary: 'Send push notifications to multiple devices',
    description:
      'Sends push notifications to multiple devices using Expo Push Notification Service. Requires manager authentication and appropriate permissions.',
  })
  @ApiResponse({
    status: 200,
    description: 'Notifications sent',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          ticketId: { type: 'string', nullable: true },
          status: { type: 'string', enum: ['ok', 'error'] },
          error: { type: 'string', nullable: true },
          message: { type: 'string', nullable: true },
        },
      },
    },
  })
  async sendBulkNotifications(@Body() dto: SendBulkExpoNotificationDto) {
    return this.notificationsService.sendBulkNotifications(dto);
  }

  @Get('test')
  @UseGuards(ManagerAuthGuard)
  @Roles(Permissions.GymOwner)
  @ApiOperation({
    summary: 'Test Expo Push API configuration',
    description:
      'Tests if Expo Push API is accessible. Note: Expo Push API does not require authentication.',
  })
  @ApiResponse({
    status: 200,
    description: 'Expo Push API status',
    schema: {
      type: 'object',
      properties: {
        configured: { type: 'boolean' },
        message: { type: 'string' },
      },
    },
  })
  async testConfiguration() {
    return {
      configured: true,
      message:
        'Expo Push API is available. No authentication required. Use /notifications/send to test sending notifications.',
    };
  }

  @Get()
  @UseGuards(AuthGuard)
  @ApiOperation({
    summary: 'Get user notifications',
    description:
      'Retrieves notifications for the authenticated user (member or manager) with pagination and filtering.',
  })
  @ApiResponse({
    status: 200,
    description: 'Notifications retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: { type: 'object' },
        },
        meta: {
          type: 'object',
          properties: {
            itemsPerPage: { type: 'number' },
            totalItems: { type: 'number' },
            currentPage: { type: 'number' },
            totalPages: { type: 'number' },
            sortBy: { type: 'array' },
            searchBy: { type: 'array' },
            filter: { type: 'object' },
          },
        },
        links: {
          type: 'object',
          properties: {
            first: { type: 'string' },
            previous: { type: 'string', nullable: true },
            current: { type: 'string' },
            next: { type: 'string', nullable: true },
            last: { type: 'string' },
          },
        },
      },
    },
  })
  async getNotifications(
    @User() user: MemberEntity | ManagerEntity,
    @Paginate() query: PaginateQuery,
  ) {
    const isMember = user instanceof MemberEntity;
    const userId = user.id;

    if (isMember) {
      return this.notificationsService.getNotificationsByMember(userId, query);
    } else {
      return this.notificationsService.getNotificationsByManager(userId, query);
    }
  }

  @Get('unread-count')
  @UseGuards(AuthGuard)
  @ApiOperation({
    summary: 'Get unread notification count',
    description:
      'Returns the count of unread notifications for the authenticated user.',
  })
  @ApiResponse({
    status: 200,
    description: 'Unread count retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        count: { type: 'number' },
      },
    },
  })
  async getUnreadCount(@User() user: MemberEntity | ManagerEntity) {
    const isMember = user instanceof MemberEntity;
    const recipientType = isMember
      ? NotificationRecipientType.MEMBER
      : NotificationRecipientType.MANAGER;

    const count = await this.notificationsService.getUnreadCount(
      user.id,
      recipientType,
    );

    return { count };
  }

  @Get('count')
  @UseGuards(AuthGuard)
  @ApiOperation({
    summary: 'Get notification count from member entity',
    description:
      'Returns the notification count stored in the member entity. This counter increments on each notification and resets when the user enters the notifications page.',
  })
  @ApiResponse({
    status: 200,
    description: 'Notification count retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        count: { type: 'number' },
      },
    },
  })
  async getNotificationCount(@User() user: MemberEntity | ManagerEntity) {
    const isMember = user instanceof MemberEntity;
    if (!isMember) {
      return { count: 0 };
    }

    const count = await this.notificationsService.getNotificationCount(user.id);
    return { count };
  }

  @Patch(':id/read')
  @UseGuards(AuthGuard)
  @ApiOperation({
    summary: 'Mark notification as read',
    description: 'Marks a specific notification as read.',
  })
  @ApiResponse({
    status: 200,
    description: 'Notification marked as read',
    type: 'object',
  })
  @ApiResponse({
    status: 404,
    description: 'Notification not found',
  })
  async markAsRead(@Param('id') id: string) {
    return this.notificationsService.markAsRead(id);
  }

  @Patch('read-all')
  @UseGuards(AuthGuard)
  @ApiOperation({
    summary: 'Mark all notifications as read',
    description:
      'Marks all unread notifications as read for the authenticated user.',
  })
  @ApiResponse({
    status: 200,
    description: 'All notifications marked as read',
    schema: {
      type: 'object',
      properties: {
        count: { type: 'number' },
      },
    },
  })
  async markAllAsRead(@User() user: MemberEntity | ManagerEntity) {
    const isMember = user instanceof MemberEntity;
    const recipientType = isMember
      ? NotificationRecipientType.MEMBER
      : NotificationRecipientType.MANAGER;

    return this.notificationsService.markAllAsRead(user.id, recipientType);
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  @ApiOperation({
    summary: 'Delete a notification',
    description: 'Deletes a specific notification.',
  })
  @ApiResponse({
    status: 200,
    description: 'Notification deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Notification not found',
  })
  async deleteNotification(@Param('id') id: string) {
    await this.notificationsService.deleteNotification(id);
    return { message: 'Notification deleted successfully' };
  }
}
