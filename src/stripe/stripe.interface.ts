import { CallWith } from './dto/request/create-setup-intent.dto';

export interface PaymentDetails {
  subscriptionId: string;
  invoiceId: string;
  customerId: string;
  amount: number;
  customer_phoneNumber?: string;
  currency: string;
  paymentMethod: string;
  products: Array<{
    name: string;
    productId: string;
    quantity: number;
    price: number;
  }>;
  metadata: {
    productId: string;
    userId: string;
    callWith: CallWith;
    callDuration: number;
  };
  status: string;
  created: Date;
  baseId?: string;
}

export interface GooglePaymentsDetails {
  invoiceId: string;
  created: Date;
  dueDate: Date;
  basePlanId: string;
  subscriptionId: string;
}
