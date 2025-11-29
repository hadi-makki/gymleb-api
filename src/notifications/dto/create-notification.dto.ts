import {
  NotificationProvider,
  NotificationCategory,
  NotificationRecipientType,
  NotificationPriority,
  NotificationDeliveryStatus,
} from '../entities/in-app-notification.entity';

export interface CreateNotificationDto {
  provider: NotificationProvider;
  category: NotificationCategory;
  recipientType: NotificationRecipientType;
  recipientId: string; // memberId or managerId
  title: string;
  body: string;
  data?: Record<string, unknown>;
  priority?: NotificationPriority;
  badge?: number;
  sound?: string;
  scheduledFor?: Date;
  // Related entities (optional)
  transactionId?: string;
  subscriptionId?: string;
  ptSessionId?: string;
  gymId?: string;
}

export interface UpdateNotificationStatusDto {
  deliveryStatus: NotificationDeliveryStatus;
  providerTicketId?: string;
  providerError?: string;
  sentAt?: Date;
  deliveredAt?: Date;
}
