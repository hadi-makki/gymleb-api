export class ReturnUserDto {
  id: string;
  name: string;
  email: string;
  phone: string;
  username: string;
  passCode: string;
  gym: any;
  subscription: any;
  transactions: any[];
  createdAt: Date;
  updatedAt: Date;
  hasActiveSubscription: boolean;
  currentActiveSubscription: any;
  isNotified: boolean;
}

export class ReturnUserWithTokenDto extends ReturnUserDto {
  token: string;
}
