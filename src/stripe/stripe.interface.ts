import { SubscriptionType } from '../subscription/entities/subscription.entity';

export interface PaymentDetails {
  subscriptionId: string;
  memberId: string;
  gymId: string;
  subscriptionType: SubscriptionType;
  amount: number;
  // If true for daily subscriptions, grant a full 24 hours. If false/undefined, expire at end of day
  giveFullDay?: boolean;
}

export interface GooglePaymentsDetails {
  invoiceId: string;
  created: Date;
  dueDate: Date;
  basePlanId: string;
  subscriptionId: string;
}
