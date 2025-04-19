import { SubscriptionType } from 'src/subscription/entities/subscription.entity';

export interface PaymentDetails {
  subscriptionId: string;
  memberId: string;
  gymId: string;
  subscriptionType: SubscriptionType;
}

export interface GooglePaymentsDetails {
  invoiceId: string;
  created: Date;
  dueDate: Date;
  basePlanId: string;
  subscriptionId: string;
}
