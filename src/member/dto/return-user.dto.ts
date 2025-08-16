export class ReturnUserDto {
  id: string;
  name: string;
  email: string;
  phone: string;
  username: string;
  passCode: string;
  gym: any;
  subscription: any;
  subscriptionInstances: any[];
  createdAt: Date;
  updatedAt: Date;
  hasActiveSubscription: boolean;
  currentActiveSubscription: any;
  isNotified: boolean;
  lastSubscription: any;
  profileImage: string;
}

export class ReturnUserWithTokenDto extends ReturnUserDto {
  token: string;
}
