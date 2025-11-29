import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { FirebaseService } from './firebase.service';
import {
  SendNotificationDto,
  SendBulkNotificationDto,
} from './dto/send-notification.dto';
import { TestNotificationDto } from './dto/test-notification.dto';
import { AuthGuard } from '../guards/auth.guard';
import { ManagerAuthGuard } from '../guards/manager-auth.guard';
import { Roles } from '../decorators/roles/Role';
import { Permissions } from '../decorators/roles/role.enum';

@ApiTags('Firebase')
@Controller('firebase')
@ApiBearerAuth()
export class FirebaseController {
  constructor(private readonly firebaseService: FirebaseService) {}

  @Post('send-notification')
  @UseGuards(AuthGuard)
  @ApiOperation({
    summary: 'Send a push notification via FCM',
    description:
      'Sends a push notification to a single device using Firebase Cloud Messaging. Requires FCM credentials to be configured.',
  })
  @ApiResponse({
    status: 200,
    description: 'Notification sent successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        messageId: { type: 'string', nullable: true },
        error: { type: 'string', nullable: true },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid request or FCM not configured',
  })
  async sendNotification(@Body() dto: SendNotificationDto) {
    return this.firebaseService.sendNotification(dto);
  }

  @Post('send-bulk-notifications')
  @UseGuards(ManagerAuthGuard)
  @Roles(Permissions.GymOwner, Permissions.update_members)
  @ApiOperation({
    summary: 'Send push notifications to multiple devices',
    description:
      'Sends push notifications to multiple devices. Requires manager authentication and appropriate permissions.',
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
          messageId: { type: 'string', nullable: true },
          error: { type: 'string', nullable: true },
        },
      },
    },
  })
  async sendBulkNotifications(@Body() dto: SendBulkNotificationDto) {
    return this.firebaseService.sendBulkNotifications(dto);
  }

  @Post('test')
  @UseGuards(ManagerAuthGuard)
  @Roles(Permissions.GymOwner)
  @ApiOperation({
    summary: 'Test FCM configuration',
    description:
      'Tests if FCM is properly configured and can obtain access tokens.',
  })
  @ApiResponse({
    status: 200,
    description: 'FCM configuration status',
    schema: {
      type: 'object',
      properties: {
        configured: { type: 'boolean' },
        message: { type: 'string' },
      },
    },
  })
  async testConfiguration() {
    const isConfigured = this.firebaseService.isConfigured();
    return {
      configured: isConfigured,
      message: isConfigured
        ? 'FCM is properly configured'
        : 'FCM is not configured. Please set FCM_SERVER_KEY_PATH and FCM_PROJECT_NAME in your .env file.',
    };
  }

  @Post('test-notification')
  @UseGuards(ManagerAuthGuard)
  @Roles(Permissions.GymOwner)
  @ApiOperation({
    summary: 'Send a test push notification',
    description:
      'Sends a test push notification to the provided FCM token. Useful for testing push notification functionality.',
  })
  @ApiResponse({
    status: 200,
    description: 'Test notification sent',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        messageId: { type: 'string', nullable: true },
        error: { type: 'string', nullable: true },
        message: { type: 'string' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid request or FCM not configured',
  })
  async testNotification(@Body() dto: TestNotificationDto) {
    const result = await this.firebaseService.sendNotification({
      token: dto.token,
      title: dto.title || 'Test Notification',
      body: dto.body,
      data: dto.data || { test: true, timestamp: new Date().toISOString() },
      sound: 'default',
      priority: 'high',
      channelId: 'default',
    });

    return {
      ...result,
      message: result.success
        ? 'Test notification sent successfully'
        : `Failed to send test notification: ${result.error}`,
    };
  }
}
