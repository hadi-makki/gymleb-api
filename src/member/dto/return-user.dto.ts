import { Transaction } from 'src/transactions/transaction.entity';

export class ReturnUserDto {
  id: string;
  name: string;
  email: string;
  phone: string;
  username: string;
  passCode: string;
  gym: any;
  subscription: any;
  subscriptionTransactions: any[];
  createdAt: Date;
  updatedAt: Date;
  hasActiveSubscription: boolean;
  currentActiveSubscription: any;
  isNotified: boolean;
  lastSubscription: Transaction;
  profileImage: string;
}

export class ReturnUserWithTokenDto extends ReturnUserDto {
  token: string;
}
