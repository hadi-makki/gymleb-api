import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, In } from 'typeorm';
import { Expo } from 'expo-server-sdk';
import { PaginateQuery, paginate, FilterOperator } from 'nestjs-paginate';
import { TokenEntity } from '../token/token.entity';
import { TokenService } from '../token/token.service';
import { RegisterExpoTokenDto } from './dto/register-expo-token.dto';
import {
  SendExpoNotificationDto,
  SendBulkExpoNotificationDto,
} from './dto/send-notification.dto';
import { InAppNotificationEntity } from './entities/in-app-notification.entity';
import {
  NotificationProvider,
  NotificationCategory,
  NotificationRecipientType,
  NotificationDeliveryStatus,
  NotificationPriority,
} from './entities/in-app-notification.entity';
import {
  CreateNotificationDto,
  UpdateNotificationStatusDto,
} from './dto/create-notification.dto';
import { MemberEntity } from '../member/entities/member.entity';
import { UserEntity } from '../user/user.entity';

export interface ExpoNotificationResult {
  success: boolean;
  ticketId?: string;
  error?: string;
  status?: 'ok' | 'error';
  message?: string;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private readonly expo: Expo;

  constructor(
    @InjectRepository(TokenEntity)
    private readonly tokenRepository: Repository<TokenEntity>,
    @InjectRepository(InAppNotificationEntity)
    private readonly notificationRepository: Repository<InAppNotificationEntity>,
    @InjectRepository(MemberEntity)
    private readonly memberRepository: Repository<MemberEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private readonly tokenService: TokenService,
  ) {
    // Create a new Expo SDK client
    this.expo = new Expo();
  }

  /**
   * Register or update Expo push token for a device
   * Links the token to the user
   */
  async registerExpoToken(
    userId: string,
    deviceId: string,
    registerExpoTokenDto: RegisterExpoTokenDto,
  ): Promise<{ message: string; success: boolean }> {
    console.log('registerExpoToken', userId, deviceId, registerExpoTokenDto);
    if (!deviceId) {
      throw new NotFoundException('Device ID is required');
    }

    if (!userId) {
      throw new NotFoundException('User ID is required');
    }

    // Find token entity by deviceId
    const tokenEntity = await this.tokenService.getTokenByDeviceId(deviceId);

    if (!tokenEntity) {
      throw new NotFoundException(
        'Token entity not found for this device. Please login first.',
      );
    }

    // Ensure the token is linked to the user
    if (!tokenEntity.user || tokenEntity.user.id !== userId) {
      // Find the user to link
      const user = await this.userRepository.findOne({
        where: { id: userId },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      tokenEntity.user = user;
      tokenEntity.userId = userId;
    }

    // Update Expo token fields
    tokenEntity.expoToken = registerExpoTokenDto.token;
    tokenEntity.expoTokenPlatform = registerExpoTokenDto.platform;
    tokenEntity.expoTokenRegisteredAt = new Date();

    await this.tokenRepository.save(tokenEntity);

    this.logger.log(
      `Expo token registered for userId: ${userId}, deviceId: ${deviceId}, platform: ${registerExpoTokenDto.platform}`,
    );

    return {
      message: 'Expo token registered successfully',
      success: true,
    };
  }

  /**
   * Unregister Expo push token for a device
   * Ensures the token belongs to the user
   */
  async unregisterExpoToken(
    userId: string,
    deviceId: string,
  ): Promise<{ message: string; success: boolean }> {
    if (!deviceId) {
      throw new NotFoundException('Device ID is required');
    }

    if (!userId) {
      throw new NotFoundException('User ID is required');
    }

    const tokenEntity = await this.tokenService.getTokenByDeviceId(deviceId);

    if (!tokenEntity) {
      throw new NotFoundException('Token entity not found for this device');
    }

    // Verify the token belongs to the user
    if (!tokenEntity.user || tokenEntity.user.id !== userId) {
      throw new NotFoundException(
        'Token does not belong to the authenticated user',
      );
    }

    // Clear Expo token fields
    tokenEntity.expoToken = null;
    tokenEntity.expoTokenPlatform = null;
    tokenEntity.expoTokenRegisteredAt = null;

    await this.tokenRepository.save(tokenEntity);

    this.logger.log(
      `Expo token unregistered for userId: ${userId}, deviceId: ${deviceId}`,
    );

    return {
      message: 'Expo token unregistered successfully',
      success: true,
    };
  }

  /**
   * Send a single notification via Expo Push API
   * Gets member by memberId, validates user and gym, creates notification linked to user and gym
   */
  async sendNotification(
    dto: SendExpoNotificationDto,
  ): Promise<ExpoNotificationResult> {
    let notification: InAppNotificationEntity | null = null;

    try {
      // Validate Expo push token format
      if (!Expo.isExpoPushToken(dto.token)) {
        this.logger.error(`Invalid Expo push token format: ${dto.token}`);
        return {
          success: false,
          status: 'error',
          error: 'Invalid Expo push token format',
        };
      }

      this.logger.log(
        `Attempting to send notification to member ${dto.memberId}. Token: ${dto.token.substring(0, 20)}...`,
      );

      // Get member from database with user and gym relations
      const member = await this.memberRepository.findOne({
        where: { id: dto.memberId },
        relations: { user: true, gym: true },
      });

      if (!member) {
        this.logger.error(`Member not found: ${dto.memberId}`);
        return {
          success: false,
          status: 'error',
          error: 'Member not found',
        };
      }

      // Get user from member - if no user, don't continue
      const user = member.user;
      if (!user) {
        this.logger.error(
          `Member ${member.id} has no user. Cannot create notification.`,
        );
        return {
          success: false,
          status: 'error',
          error: 'Member has no associated user. Cannot send notification.',
        };
      }

      // Get gym from member
      const gym = member.gym;
      if (!gym) {
        this.logger.error(
          `Member ${member.id} has no gym. Cannot create notification.`,
        );
        return {
          success: false,
          status: 'error',
          error: 'Member has no associated gym. Cannot send notification.',
        };
      }

      this.logger.log(
        `Found member ${member.id}, user ${user.id}, gym ${gym.id}. Creating notification.`,
      );

      // Extract category from DTO or data, otherwise default to GENERAL
      const category =
        (dto.category as NotificationCategory) ||
        (dto.data?.category as NotificationCategory) ||
        NotificationCategory.GENERAL;

      // Map priority from Expo format to NotificationPriority
      const priority =
        dto.priority === 'high'
          ? NotificationPriority.HIGH
          : dto.priority === 'normal'
            ? NotificationPriority.NORMAL
            : NotificationPriority.NORMAL;

      // Extract related entity IDs from data if available
      const transactionId = dto.data?.transactionId as string | undefined;
      const subscriptionId = dto.data?.subscriptionId as string | undefined;
      const ptSessionId = dto.data?.ptSessionId as string | undefined;

      // Create notification record linked to member, user, and gym
      notification = await this.createNotificationRecord({
        provider: NotificationProvider.EXPO,
        category,
        recipientType: NotificationRecipientType.MEMBER,
        recipientId: member.id,
        title: dto.title,
        body: dto.body,
        data: dto.data || {},
        priority,
        badge: dto.badge,
        sound: dto.sound || 'default',
        transactionId,
        subscriptionId,
        ptSessionId,
        gymId: gym.id,
      });

      this.logger.log(
        `Notification record created. ID: ${notification.id}, Member: ${member.id}, User: ${user.id}, Gym: ${gym.id}`,
      );

      // Increment user's notificationCount
      await this.userRepository.increment(
        { id: user.id },
        'notificationCount',
        1,
      );

      // Also increment member's notificationCount for backward compatibility
      await this.memberRepository.increment(
        { id: member.id },
        'notificationCount',
        1,
      );

      this.logger.log(
        `Incremented notificationCount for user ${user.id} and member ${member.id}`,
      );

      // Create a message for Expo
      const message = {
        to: dto.token,
        sound: dto.sound || 'default',
        title: dto.title,
        body: dto.body,
        data: dto.data || {},
        priority: (dto.priority === 'high' ? 'high' : 'default') as
          | 'default'
          | 'normal'
          | 'high',
        ...(dto.badge !== undefined ? { badge: dto.badge } : {}),
      };

      // Send the notification via Expo
      const tickets = await this.expo.sendPushNotificationsAsync([message]);
      const ticket = tickets[0];

      if (!ticket) {
        // Update notification status if record was created
        if (notification) {
          await this.updateNotificationStatus(notification.id, {
            deliveryStatus: NotificationDeliveryStatus.FAILED,
            providerError: 'No ticket returned from Expo',
          });
        }
        return {
          success: false,
          status: 'error',
          error: 'No ticket returned from Expo',
        };
      }

      // Check if there was an error
      if (ticket.status === 'error') {
        this.logger.error('Expo notification error:', ticket);
        const errorMessage =
          ('message' in ticket ? ticket.message : undefined) ||
          ('details' in ticket && ticket.details?.error
            ? String(ticket.details.error)
            : undefined) ||
          'Unknown error from Expo Push API';

        // Update notification status if record was created
        if (notification) {
          await this.updateNotificationStatus(notification.id, {
            deliveryStatus: NotificationDeliveryStatus.FAILED,
            providerError: errorMessage,
          });
        }

        return {
          success: false,
          status: 'error',
          ticketId: 'id' in ticket ? String(ticket.id) : undefined,
          error: errorMessage,
        };
      }

      // Update notification status if record was created
      if (notification) {
        await this.updateNotificationStatus(notification.id, {
          deliveryStatus: NotificationDeliveryStatus.SENT,
          providerTicketId: 'id' in ticket ? String(ticket.id) : undefined,
          sentAt: new Date(),
        });
      }

      this.logger.log(`Expo notification sent successfully: ${ticket.id}`);
      return {
        success: true,
        status: 'ok',
        ticketId: String(ticket.id),
        message: 'Notification sent successfully',
      };
    } catch (error) {
      this.logger.error('Error sending Expo notification:', error);

      // Update notification status if record was created
      if (notification) {
        await this.updateNotificationStatus(notification.id, {
          deliveryStatus: NotificationDeliveryStatus.FAILED,
          providerError:
            error instanceof Error ? error.message : 'Unknown error',
        });
      }

      return {
        success: false,
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Send notifications to multiple devices
   */
  async sendBulkNotifications(
    dto: SendBulkExpoNotificationDto,
  ): Promise<ExpoNotificationResult[]> {
    try {
      // Filter out invalid tokens and create messages
      const validTokens: string[] = [];
      const messages = dto.tokens
        .map((token) => {
          if (!Expo.isExpoPushToken(token)) {
            this.logger.warn(`Invalid Expo push token: ${token}`);
            return null;
          }
          validTokens.push(token);
          return {
            to: token,
            sound: dto.sound || 'default',
            title: dto.title,
            body: dto.body,
            data: dto.data || {},
            priority: (dto.priority === 'high' ? 'high' : 'default') as
              | 'default'
              | 'normal'
              | 'high',
            ...(dto.badge !== undefined ? { badge: dto.badge } : {}),
          };
        })
        .filter((msg): msg is NonNullable<typeof msg> => msg !== null);

      if (messages.length === 0) {
        this.logger.warn('No valid Expo push tokens provided');
        return dto.tokens.map(() => ({
          success: false,
          status: 'error' as const,
          error: 'Invalid Expo push token',
        }));
      }

      // Send notifications in chunks (Expo SDK handles batching automatically)
      const tickets = await this.expo.sendPushNotificationsAsync(messages);

      // Map tickets to results
      return dto.tokens.map((token, index) => {
        const tokenIndex = validTokens.indexOf(token);
        if (tokenIndex === -1) {
          // Invalid token
          return {
            success: false,
            status: 'error' as const,
            error: 'Invalid Expo push token',
          };
        }

        const ticket = tickets[tokenIndex];
        if (!ticket) {
          return {
            success: false,
            status: 'error' as const,
            error: 'No ticket returned from Expo',
          };
        }

        if (ticket.status === 'error') {
          this.logger.error(
            `Expo notification error for token ${index}:`,
            ticket,
          );
          const errorMessage =
            ('message' in ticket ? ticket.message : undefined) ||
            ('details' in ticket && ticket.details?.error
              ? String(ticket.details.error)
              : undefined) ||
            'Unknown error from Expo Push API';
          return {
            success: false,
            status: 'error' as const,
            ticketId: 'id' in ticket ? String(ticket.id) : undefined,
            error: errorMessage,
          };
        }

        return {
          success: true,
          status: 'ok' as const,
          ticketId: String(ticket.id),
          message: 'Notification sent successfully',
        };
      });
    } catch (error) {
      this.logger.error('Error sending bulk Expo notifications:', error);
      return dto.tokens.map(() => ({
        success: false,
        status: 'error' as const,
        error: error instanceof Error ? error.message : 'Unknown error',
      }));
    }
  }

  /**
   * Send notification to a member by their device token
   */
  async sendNotificationToMember(
    memberId: string,
    title: string,
    body: string,
    data?: Record<string, unknown>,
    options?: {
      category?: NotificationCategory;
      priority?: NotificationPriority;
      badge?: number;
      sound?: string;
      transactionId?: string;
      subscriptionId?: string;
      ptSessionId?: string;
      gymId?: string;
    },
  ): Promise<ExpoNotificationResult[]> {
    // Find all token entities for this member
    const tokenEntities = await this.tokenRepository.find({
      where: {
        member: { id: memberId },
      },
      relations: {
        member: true,
      },
    });

    if (tokenEntities.length === 0) {
      this.logger.warn(`No token entities found for member: ${memberId}`);
      return [
        {
          success: false,
          status: 'error',
          error: 'No device tokens found for this member',
        },
      ];
    }

    // Filter tokens that have Expo tokens
    const expoTokens = tokenEntities
      .filter((token) => token.expoToken)
      .map((token) => token.expoToken!);

    if (expoTokens.length === 0) {
      this.logger.warn(
        `No Expo tokens found for member: ${memberId}. Member may be using FCM tokens.`,
      );
      return [
        {
          success: false,
          status: 'error',
          error: 'No Expo tokens found for this member',
        },
      ];
    }

    // Get member with user relation to increment user's notificationCount
    const member = await this.memberRepository.findOne({
      where: { id: memberId },
      relations: ['user'],
      select: ['id', 'user'],
    });

    // Create notification record before sending
    const notification = await this.createNotificationRecord({
      provider: NotificationProvider.EXPO,
      category: options?.category || NotificationCategory.GENERAL,
      recipientType: NotificationRecipientType.MEMBER,
      recipientId: memberId,
      title,
      body,
      data,
      priority: options?.priority || NotificationPriority.NORMAL,
      badge: options?.badge,
      sound: options?.sound || 'default',
      transactionId: options?.transactionId,
      subscriptionId: options?.subscriptionId,
      ptSessionId: options?.ptSessionId,
      gymId: options?.gymId,
    });

    // Increment notification counter for the member
    await this.memberRepository.increment(
      { id: memberId },
      'notificationCount',
      1,
    );

    // Increment notification counter for the user if member has a user
    if (member?.user) {
      await this.userRepository.increment(
        { id: member.user.id },
        'notificationCount',
        1,
      );
    }

    // Map NotificationPriority to Expo priority format
    const expoPriority =
      options?.priority === NotificationPriority.HIGH
        ? 'high'
        : options?.priority === NotificationPriority.NORMAL
          ? 'normal'
          : 'default';

    // Send notifications
    const results = await this.sendBulkNotifications({
      tokens: expoTokens,
      title,
      body,
      data,
      sound: options?.sound || 'default',
      priority: expoPriority,
      badge: options?.badge,
    });

    // Update notification status based on results
    const hasSuccess = results.some((r) => r.success);
    const hasError = results.some((r) => !r.success);
    const firstError = results.find((r) => !r.success);
    const firstSuccess = results.find((r) => r.success);

    if (hasSuccess) {
      await this.updateNotificationStatus(notification.id, {
        deliveryStatus: NotificationDeliveryStatus.SENT,
        providerTicketId: firstSuccess?.ticketId,
        sentAt: new Date(),
      });
    } else if (hasError) {
      await this.updateNotificationStatus(notification.id, {
        deliveryStatus: NotificationDeliveryStatus.FAILED,
        providerError: firstError?.error || 'Failed to send notification',
      });
    }

    return results;
  }

  /**
   * Send test notification to a member (for testing purposes)
   * Verifies the member belongs to the user before sending
   */
  async sendTestNotificationToMember(
    userId: string,
    dto: {
      memberId: string;
      title: string;
      body: string;
      category?: NotificationCategory;
      data?: Record<string, unknown>;
      sound?: string;
      priority?: 'default' | 'normal' | 'high';
      badge?: number;
      gymId?: string;
    },
  ): Promise<ExpoNotificationResult[]> {
    // Verify the member belongs to the authenticated user
    const member = await this.memberRepository.findOne({
      where: {
        id: dto.memberId,
        user: { id: userId },
      },
    });

    if (!member) {
      throw new NotFoundException(
        'Member not found or you do not have access to this member',
      );
    }

    // Map priority string to NotificationPriority enum
    const priorityMap: Record<
      'default' | 'normal' | 'high',
      NotificationPriority
    > = {
      default: NotificationPriority.NORMAL,
      normal: NotificationPriority.NORMAL,
      high: NotificationPriority.HIGH,
    };

    return await this.sendNotificationToMember(
      dto.memberId,
      dto.title,
      dto.body,
      dto.data,
      {
        category: dto.category,
        priority: dto.priority
          ? priorityMap[dto.priority] || NotificationPriority.NORMAL
          : NotificationPriority.NORMAL,
        badge: dto.badge,
        sound: dto.sound || 'default',
        gymId: dto.gymId,
      },
    );
  }

  /**
   * Send notification to a manager by their device token
   */
  async sendNotificationToManager(
    managerId: string,
    title: string,
    body: string,
    data?: Record<string, unknown>,
    options?: {
      category?: NotificationCategory;
      priority?: NotificationPriority;
      badge?: number;
      sound?: string;
      transactionId?: string;
      subscriptionId?: string;
      ptSessionId?: string;
      gymId?: string;
    },
  ): Promise<ExpoNotificationResult[]> {
    // Find all token entities for this manager
    const tokenEntities = await this.tokenRepository.find({
      where: {
        manager: { id: managerId },
      },
      relations: {
        manager: true,
      },
    });

    if (tokenEntities.length === 0) {
      this.logger.warn(`No token entities found for manager: ${managerId}`);
      return [
        {
          success: false,
          status: 'error',
          error: 'No device tokens found for this manager',
        },
      ];
    }

    // Filter tokens that have Expo tokens
    const expoTokens = tokenEntities
      .filter((token) => token.expoToken)
      .map((token) => token.expoToken!);

    if (expoTokens.length === 0) {
      this.logger.warn(
        `No Expo tokens found for manager: ${managerId}. Manager may be using FCM tokens.`,
      );
      return [
        {
          success: false,
          status: 'error',
          error: 'No Expo tokens found for this manager',
        },
      ];
    }

    // Create notification record before sending
    const notification = await this.createNotificationRecord({
      provider: NotificationProvider.EXPO,
      category: options?.category || NotificationCategory.GENERAL,
      recipientType: NotificationRecipientType.MANAGER,
      recipientId: managerId,
      title,
      body,
      data,
      priority: options?.priority || NotificationPriority.NORMAL,
      badge: options?.badge,
      sound: options?.sound || 'default',
      transactionId: options?.transactionId,
      subscriptionId: options?.subscriptionId,
      ptSessionId: options?.ptSessionId,
      gymId: options?.gymId,
    });

    // Map NotificationPriority to Expo priority format
    const expoPriority =
      options?.priority === NotificationPriority.HIGH
        ? 'high'
        : options?.priority === NotificationPriority.NORMAL
          ? 'normal'
          : 'default';

    // Send notifications
    const results = await this.sendBulkNotifications({
      tokens: expoTokens,
      title,
      body,
      data,
      sound: options?.sound || 'default',
      priority: expoPriority,
      badge: options?.badge,
    });

    // Update notification status based on results
    const hasSuccess = results.some((r) => r.success);
    const hasError = results.some((r) => !r.success);
    const firstError = results.find((r) => !r.success);
    const firstSuccess = results.find((r) => r.success);

    if (hasSuccess) {
      await this.updateNotificationStatus(notification.id, {
        deliveryStatus: NotificationDeliveryStatus.SENT,
        providerTicketId: firstSuccess?.ticketId,
        sentAt: new Date(),
      });
    } else if (hasError) {
      await this.updateNotificationStatus(notification.id, {
        deliveryStatus: NotificationDeliveryStatus.FAILED,
        providerError: firstError?.error || 'Failed to send notification',
      });
    }

    return results;
  }

  /**
   * Unregister Expo token for a device
   */

  /**
   * Create a notification record in the database
   */
  private async createNotificationRecord(
    dto: CreateNotificationDto,
  ): Promise<InAppNotificationEntity> {
    // If notification is for a member, get the member's user to link the notification
    let userId: string | null = null;
    if (dto.recipientType === NotificationRecipientType.MEMBER) {
      const member = await this.memberRepository.findOne({
        where: { id: dto.recipientId },
        relations: ['user'],
        select: ['id', 'user'],
      });
      if (member?.user) {
        userId = member.user.id;
      }
    }

    const notification = this.notificationRepository.create({
      provider: dto.provider,
      category: dto.category,
      recipientType: dto.recipientType,
      recipientId: dto.recipientId,
      title: dto.title,
      body: dto.body,
      data: dto.data || {},
      priority: dto.priority || NotificationPriority.NORMAL,
      badge: dto.badge,
      sound: dto.sound || 'default',
      scheduledFor: dto.scheduledFor,
      deliveryStatus: NotificationDeliveryStatus.PENDING,
      isRead: false,
      ...(dto.recipientType === NotificationRecipientType.MEMBER
        ? { member: { id: dto.recipientId } }
        : { manager: { id: dto.recipientId } }),
      ...(userId && { user: { id: userId } }),
      ...(dto.transactionId && { transaction: { id: dto.transactionId } }),
      ...(dto.subscriptionId && { subscription: { id: dto.subscriptionId } }),
      ...(dto.ptSessionId && { ptSession: { id: dto.ptSessionId } }),
      ...(dto.gymId && { gym: { id: dto.gymId } }),
    });

    return await this.notificationRepository.save(notification);
  }

  /**
   * Update notification status after sending
   */
  private async updateNotificationStatus(
    notificationId: string,
    update: UpdateNotificationStatusDto,
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
   * Get notifications for a member
   */
  async getNotificationsByMember(memberId: string, query: PaginateQuery) {
    // Reset notification counter when user enters notifications page (first page only)
    const page = query.page || 1;
    if (page === 1) {
      await this.resetNotificationCount(memberId);
    }

    console.log('this is the member id', memberId);

    // Build where clause
    const where: FindOptionsWhere<InAppNotificationEntity> = {
      member: { id: memberId },
    };

    // Apply filters from query if they exist
    if (query.filter?.category) {
      const categoryValue = Array.isArray(query.filter.category)
        ? query.filter.category[0]
        : query.filter.category;
      where.category = categoryValue as NotificationCategory;
    }
    if (query.filter?.isRead !== undefined) {
      const isReadValue = Array.isArray(query.filter.isRead)
        ? query.filter.isRead[0]
        : query.filter.isRead;
      where.isRead =
        typeof isReadValue === 'string'
          ? isReadValue === 'true' || isReadValue === '1'
          : Boolean(isReadValue);
    }

    return await paginate(query, this.notificationRepository, {
      where,
      sortableColumns: ['createdAt', 'readAt', 'category', 'isRead'],
      defaultSortBy: [['createdAt', 'DESC']],
      filterableColumns: {
        category: [FilterOperator.EQ],
        isRead: [FilterOperator.EQ],
      },
    });
  }

  /**
   * Get notifications for a manager
   */
  async getNotificationsByManager(managerId: string, query: PaginateQuery) {
    // Build where clause
    const where: FindOptionsWhere<InAppNotificationEntity> = {
      managerId,
    };

    // Apply filters from query if they exist
    if (query.filter?.category) {
      const categoryValue = Array.isArray(query.filter.category)
        ? query.filter.category[0]
        : query.filter.category;
      where.category = categoryValue as NotificationCategory;
    }
    if (query.filter?.isRead !== undefined) {
      const isReadValue = Array.isArray(query.filter.isRead)
        ? query.filter.isRead[0]
        : query.filter.isRead;
      where.isRead =
        typeof isReadValue === 'string'
          ? isReadValue === 'true' || isReadValue === '1'
          : Boolean(isReadValue);
    }

    return await paginate(query, this.notificationRepository, {
      where,
      sortableColumns: ['createdAt', 'readAt', 'category', 'isRead'],
      defaultSortBy: [['createdAt', 'DESC']],
      filterableColumns: {
        category: [FilterOperator.EQ],
        isRead: [FilterOperator.EQ],
      },
    });
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string): Promise<InAppNotificationEntity> {
    const notification = await this.notificationRepository.findOne({
      where: { id: notificationId },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    notification.isRead = true;
    notification.readAt = new Date();

    const savedNotification =
      await this.notificationRepository.save(notification);

    // Return notification with navigation data from the data field
    return savedNotification;
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(
    userId: string,
    recipientType: NotificationRecipientType,
  ): Promise<{ count: number }> {
    const updateResult = await this.notificationRepository.update(
      {
        recipientId: userId,
        recipientType,
        isRead: false,
      },
      {
        isRead: true,
        readAt: new Date(),
      },
    );

    return { count: updateResult.affected || 0 };
  }

  /**
   * Get unread count for a user
   */
  async getUnreadCount(
    userId: string,
    recipientType: NotificationRecipientType,
  ): Promise<number> {
    return await this.notificationRepository.count({
      where: {
        recipientId: userId,
        recipientType,
        isRead: false,
      },
    });
  }

  /**
   * Delete a notification
   */
  async deleteNotification(notificationId: string): Promise<void> {
    const result = await this.notificationRepository.delete(notificationId);
    if (result.affected === 0) {
      throw new NotFoundException('Notification not found');
    }
  }

  /**
   * Reset notification count for a member
   */
  async resetNotificationCount(memberId: string): Promise<void> {
    await this.memberRepository.update(
      { id: memberId },
      { notificationCount: 0 },
    );
  }

  /**
   * Reset notification count for a user
   */
  async resetUserNotificationCount(userId: string): Promise<void> {
    await this.userRepository.update({ id: userId }, { notificationCount: 0 });
  }

  /**
   * Get notification count for a member
   */
  async getNotificationCount(memberId: string): Promise<number> {
    const member = await this.memberRepository.findOne({
      where: { id: memberId },
      select: ['notificationCount'],
    });

    if (!member) {
      throw new NotFoundException('Member not found');
    }

    return member.notificationCount;
  }

  /**
   * Get notifications for all members under a user
   * Returns notifications with gym information
   * Queries directly by user relation
   */
  async getNotificationsByUser(
    userId: string,
    query: PaginateQuery,
  ): Promise<any> {
    // Reset notification counter when user enters notifications page (first page only)
    const page = query.page || 1;
    if (page === 1) {
      await this.resetUserNotificationCount(userId);
    }

    // Build where clause to get notifications for the user
    const where: FindOptionsWhere<InAppNotificationEntity> = {
      user: { id: userId },
    };

    // Apply filters from query if they exist
    if (query.filter?.category) {
      const categoryValue = Array.isArray(query.filter.category)
        ? query.filter.category[0]
        : query.filter.category;
      where.category = categoryValue as NotificationCategory;
    }
    if (query.filter?.isRead !== undefined) {
      const isReadValue = Array.isArray(query.filter.isRead)
        ? query.filter.isRead[0]
        : query.filter.isRead;
      where.isRead =
        typeof isReadValue === 'string'
          ? isReadValue === 'true' || isReadValue === '1'
          : Boolean(isReadValue);
    }

    return await paginate(query, this.notificationRepository, {
      where,
      relations: ['gym', 'member', 'user'],
      sortableColumns: ['createdAt', 'readAt', 'category', 'isRead'],
      defaultSortBy: [['createdAt', 'DESC']],
      filterableColumns: {
        category: [FilterOperator.EQ],
        isRead: [FilterOperator.EQ],
      },
    });
  }

  /**
   * Get unread notification count for all members under a user
   * Queries directly by user relation
   */
  async getUnreadCountByUser(userId: string): Promise<number> {
    return await this.notificationRepository.count({
      where: {
        user: { id: userId },
        isRead: false,
      },
    });
  }

  /**
   * Get total notification count for a user
   * Returns the user's notificationCount directly
   */
  async getNotificationCountByUser(userId: string): Promise<number> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: ['notificationCount'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user.notificationCount || 0;
  }

  /**
   * Mark all notifications as read for all members under a user
   * Queries directly by user relation
   */
  async markAllAsReadByUser(userId: string): Promise<{ count: number }> {
    const updateResult = await this.notificationRepository.update(
      {
        user: { id: userId },
        isRead: false,
      },
      {
        isRead: true,
        readAt: new Date(),
      },
    );

    // Reset user's notificationCount after marking all as read
    await this.resetUserNotificationCount(userId);

    return { count: updateResult.affected || 0 };
  }
}
