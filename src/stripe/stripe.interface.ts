import { Member } from '../member/entities/member.model';
import {
  Subscription,
  SubscriptionType,
} from '../subscription/entities/subscription.model';
import { Gym } from '../gym/entities/gym.model';
import { MemberEntity } from 'src/member/entities/member.entity';
import { SubscriptionEntity } from 'src/subscription/entities/subscription.entity';
import { GymEntity } from 'src/gym/entities/gym.entity';

export interface PaymentDetails {
  subscription: SubscriptionEntity;
  member: MemberEntity;
  gym: GymEntity;
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
