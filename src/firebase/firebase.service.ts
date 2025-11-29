import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JWT } from 'google-auth-library';
import * as fs from 'fs';
import * as path from 'path';
import {
  SendNotificationDto,
  SendBulkNotificationDto,
} from './dto/send-notification.dto';
import { InAppNotificationEntity } from '../notifications/entities/in-app-notification.entity';
import {
  NotificationProvider,
  NotificationCategory,
  NotificationRecipientType,
  NotificationDeliveryStatus,
  NotificationPriority,
} from '../notifications/entities/in-app-notification.entity';
import { MemberEntity } from '../member/entities/member.entity';

export interface FCMNotificationResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

@Injectable()
export class FirebaseService implements OnModuleInit {
  private readonly logger = new Logger(FirebaseService.name);
  private fcmKey: any = null;
  private fcmProjectName: string | null = null;
  private accessToken: string | null = null;
  private accessTokenExpiry: number = 0;

  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(InAppNotificationEntity)
    private readonly notificationRepository: Repository<InAppNotificationEntity>,
    @InjectRepository(MemberEntity)
    private readonly memberRepository: Repository<MemberEntity>,
  ) {}

  async onModuleInit() {
    await this.initializeFCM();
  }

  /**
   * Initialize FCM credentials
   */
  private async initializeFCM(): Promise<void> {
    try {
      const fcmKeyPath = this.configService.get<string>('FCM_SERVER_KEY_PATH');
      const fcmProjectName = this.configService.get<string>('FCM_PROJECT_NAME');

      if (!fcmKeyPath || !fcmProjectName) {
        this.logger.warn(
          'FCM credentials not configured. Push notifications via FCM will not be available.',
        );
        this.logger.warn(
          'Set FCM_SERVER_KEY_PATH and FCM_PROJECT_NAME in your .env file to enable FCM.',
        );
        return;
      }

      // Resolve path relative to project root
      const resolvedPath = path.isAbsolute(fcmKeyPath)
        ? fcmKeyPath
        : path.join(process.cwd(), fcmKeyPath);

      if (!fs.existsSync(resolvedPath)) {
        this.logger.error(`FCM key file not found at: ${resolvedPath}`);
        return;
      }

      const keyFileContent = fs.readFileSync(resolvedPath, 'utf8');
      this.fcmKey = JSON.parse(keyFileContent);
      this.fcmProjectName = fcmProjectName;

      this.logger.log('FCM initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize FCM:', error);
    }
  }

  /**
   * Check if FCM is configured
   */
  isConfigured(): boolean {
    return this.fcmKey !== null && this.fcmProjectName !== null;
  }

  /**
   * Get OAuth 2.0 access token for FCM
   */
  private async getAccessToken(): Promise<string | null> {
    if (!this.isConfigured()) {
      this.logger.error('FCM is not configured');
      return null;
    }

    // Return cached token if still valid (tokens typically expire in 1 hour)
    const now = Date.now();
    if (this.accessToken && now < this.accessTokenExpiry - 60000) {
      // Refresh 1 minute before expiry
      return this.accessToken;
    }

    try {
      const jwtClient = new JWT({
        email: this.fcmKey.client_email,
        key: this.fcmKey.private_key,
        scopes: ['https://www.googleapis.com/auth/cloud-platform'],
      });

      const tokens = await jwtClient.authorize();
      this.accessToken = tokens.access_token || null;
      // Set expiry to 55 minutes from now (tokens typically last 1 hour)
      this.accessTokenExpiry = Date.now() + 55 * 60 * 1000;

      return this.accessToken;
    } catch (error) {
      this.logger.error('Failed to get FCM access token:', error);
      return null;
    }
  }

  /**
   * Send a single notification via FCM
   */
  async sendNotification(
    dto: SendNotificationDto,
  ): Promise<FCMNotificationResult> {
    if (!this.isConfigured()) {
      return {
        success: false,
        error:
          'FCM is not configured. Please set FCM_SERVER_KEY_PATH and FCM_PROJECT_NAME in your .env file.',
      };
    }

    const accessToken = await this.getAccessToken();
    if (!accessToken) {
      return {
        success: false,
        error: 'Failed to obtain FCM access token',
      };
    }

    try {
      // Determine if this is an Expo token or native FCM token
      const isExpoToken = dto.token.startsWith('ExponentPushToken[');

      const messageBody: any = {
        message: {
          token: dto.token,
          notification: {
            title: dto.title,
            body: dto.body,
          },
          data: {
            ...(dto.data || {}),
            // Convert data values to strings (FCM requirement)
            ...Object.fromEntries(
              Object.entries(dto.data || {}).map(([key, value]) => [
                key,
                typeof value === 'string' ? value : JSON.stringify(value),
              ]),
            ),
          },
          android: {
            priority: dto.priority === 'high' ? 'high' : 'normal',
            notification: {
              sound: dto.sound || 'default',
              channelId: dto.channelId || 'default',
            },
          },
          apns: {
            payload: {
              aps: {
                sound: dto.sound || 'default',
                alert: {
                  title: dto.title,
                  body: dto.body,
                },
              },
            },
          },
        },
      };

      // Add Expo-specific fields if it's an Expo token
      if (isExpoToken) {
        const expoConfig = this.configService.get('EXPO_PROJECT_SLUG');
        if (expoConfig) {
          messageBody.message.data.experienceId = expoConfig;
          messageBody.message.data.scopeKey = expoConfig;
        }
      }

      const response = await fetch(
        `https://fcm.googleapis.com/v1/projects/${this.fcmProjectName}/messages:send`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: 'application/json',
            'Accept-encoding': 'gzip, deflate',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(messageBody),
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        this.logger.error('FCM API error:', errorData);
        return {
          success: false,
          error: errorData.error?.message || 'Failed to send notification',
        };
      }

      const result = await response.json();
      this.logger.log(`Notification sent successfully: ${result.name}`);

      return {
        success: true,
        messageId: result.name,
      };
    } catch (error) {
      this.logger.error('Error sending FCM notification:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Create a notification record in the database
   */
  private async createNotificationRecord(dto: {
    recipientType: NotificationRecipientType;
    recipientId: string;
    title: string;
    body: string;
    data?: Record<string, unknown>;
    priority?: NotificationPriority;
    badge?: number;
    sound?: string;
    category?: NotificationCategory;
    transactionId?: string;
    subscriptionId?: string;
    ptSessionId?: string;
    gymId?: string;
  }): Promise<InAppNotificationEntity> {
    const notification = this.notificationRepository.create({
      provider: NotificationProvider.FIREBASE,
      category: dto.category || NotificationCategory.GENERAL,
      recipientType: dto.recipientType,
      recipientId: dto.recipientId,
      title: dto.title,
      body: dto.body,
      data: dto.data || {},
      priority: dto.priority || NotificationPriority.NORMAL,
      badge: dto.badge,
      sound: dto.sound || 'default',
      deliveryStatus: NotificationDeliveryStatus.PENDING,
      isRead: false,
      ...(dto.recipientType === NotificationRecipientType.MEMBER
        ? { memberId: dto.recipientId }
        : { managerId: dto.recipientId }),
      ...(dto.transactionId && { transactionId: dto.transactionId }),
      ...(dto.subscriptionId && { subscriptionId: dto.subscriptionId }),
      ...(dto.ptSessionId && { ptSessionId: dto.ptSessionId }),
      ...(dto.gymId && { gymId: dto.gymId }),
    });

    return await this.notificationRepository.save(notification);
  }

  /**
   * Update notification status after sending
   */
  private async updateNotificationStatus(
    notificationId: string,
    update: {
      deliveryStatus: NotificationDeliveryStatus;
      providerTicketId?: string;
      providerError?: string;
      sentAt?: Date;
      deliveredAt?: Date;
    },
  ): Promise<void> {
    await this.notificationRepository.update(notificationId, {
      deliveryStatus: update.deliveryStatus,
      providerTicketId: update.providerTicketId,
      providerError: update.providerError,
      sentAt: update.sentAt || new Date(),
      deliveredAt: update.deliveredAt,
    });
  }

  /**
   * Send notifications to multiple devices
   */
  async sendBulkNotifications(
    dto: SendBulkNotificationDto,
  ): Promise<FCMNotificationResult[]> {
    const results: FCMNotificationResult[] = [];

    // FCM doesn't have a true bulk API, so we send individually
    // In production, you might want to batch these or use a queue
    for (const token of dto.tokens) {
      const result = await this.sendNotification({
        token,
        title: dto.title,
        body: dto.body,
        data: dto.data,
        sound: dto.sound,
        channelId: dto.channelId,
      });
      results.push(result);
    }

    return results;
  }

  /**
   * Send notification to a member by their stored token
   */
  async sendNotificationToMember(
    memberToken: string,
    title: string,
    body: string,
    data?: Record<string, unknown>,
    options?: {
      memberId?: string;
      category?: NotificationCategory;
      priority?: NotificationPriority;
      badge?: number;
      sound?: string;
      transactionId?: string;
      subscriptionId?: string;
      ptSessionId?: string;
      gymId?: string;
    },
  ): Promise<FCMNotificationResult> {
    let notification: InAppNotificationEntity | null = null;

    // Create notification record if memberId is provided
    if (options?.memberId) {
      notification = await this.createNotificationRecord({
        recipientType: NotificationRecipientType.MEMBER,
        recipientId: options.memberId,
        title,
        body,
        data,
        category: options.category,
        priority: options.priority,
        badge: options.badge,
        sound: options.sound,
        transactionId: options.transactionId,
        subscriptionId: options.subscriptionId,
        ptSessionId: options.ptSessionId,
        gymId: options.gymId,
      });

      // Increment notification counter for the member
      await this.memberRepository.increment(
        { id: options.memberId },
        'notificationCount',
        1,
      );
    }

    const result = await this.sendNotification({
      token: memberToken,
      title,
      body,
      data,
      sound: options?.sound,
      priority: options?.priority as 'default' | 'normal' | 'high',
    });

    // Update notification status if record was created
    if (notification) {
      if (result.success) {
        await this.updateNotificationStatus(notification.id, {
          deliveryStatus: NotificationDeliveryStatus.SENT,
          providerTicketId: result.messageId,
          sentAt: new Date(),
        });
      } else {
        await this.updateNotificationStatus(notification.id, {
          deliveryStatus: NotificationDeliveryStatus.FAILED,
          providerError: result.error || 'Failed to send notification',
        });
      }
    }

    return result;
  }
}
