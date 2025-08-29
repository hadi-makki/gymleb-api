import { MediaEntity } from 'src/media/media.entity';
import { TransactionEntity } from 'src/transactions/transaction.entity';
import { Transaction } from 'src/transactions/transaction.model';

export class ReturnUserDto {
  id: string;
  name: string;
  email: string;
  phone: string;
  gym: any;
  subscription: any;
  subscriptionTransactions: any[];
  createdAt: Date;
  updatedAt: Date;
  hasActiveSubscription: boolean;
  currentActiveSubscription: any;
  isNotified: boolean;
  lastSubscription: TransactionEntity;
  profileImage: MediaEntity;
}

export class ReturnUserWithTokenDto extends ReturnUserDto {
  token: string;
}
