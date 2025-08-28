import { Member } from '../member/entities/member.entity';
import {
  Subscription,
  SubscriptionType,
} from '../subscription/entities/subscription.entity';
import { Gym } from '../gym/entities/gym.model';

export interface PaymentDetails {
  subscription: Subscription;
  member: Member;
  gym: Gym;
  subscriptionType: SubscriptionType;
  amount: number;
  // If true for daily subscriptions, grant a full 24 hours. If false/undefined, expire at end of day
  giveFullDay?: boolean;
  // Optional custom start date for subscription instance
  startDate?: string;
  // Optional custom end date for subscription instance
  endDate?: string;
}

export interface GooglePaymentsDetails {
  invoiceId: string;
  created: Date;
  dueDate: Date;
  basePlanId: string;
  subscriptionId: string;
}
