import { SubscriptionType } from '../subscription/entities/subscription.entity';

export interface PaymentDetails {
  subscriptionId: string;
  memberId: string;
  gymId: string;
  subscriptionType: SubscriptionType;
  amount: number;
}

export interface GooglePaymentsDetails {
  invoiceId: string;
  created: Date;
  dueDate: Date;
  basePlanId: string;
  subscriptionId: string;
}
