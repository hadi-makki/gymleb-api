import { GymEntity } from 'src/gym/entities/gym.entity';
import { MemberEntity } from 'src/member/entities/member.entity';
import {
  SubscriptionEntity,
  SubscriptionType,
} from 'src/subscription/entities/subscription.entity';

export interface PaymentDetails {
  subscription?: SubscriptionEntity;
  member: MemberEntity;
  gym: GymEntity;
  subscriptionType?: SubscriptionType;
  amount: number;
  // If true for daily subscriptions, grant a full 24 hours. If false/undefined, expire at end of day
  giveFullDay?: boolean;
  // Optional custom start date for subscription instance
  startDate?: string;
  // Optional custom end date for subscription instance
  endDate?: string;
  willPayLater?: boolean;

  paidAmount?: number;

  forFree?: boolean;

  isBirthdaySubscription?: boolean;
}

export interface GooglePaymentsDetails {
  invoiceId: string;
  created: Date;
  dueDate: Date;
  basePlanId: string;
  subscriptionId: string;
}
