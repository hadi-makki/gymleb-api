import { ConfigService } from '@nestjs/config/dist/config.service';
import { Model } from 'mongoose';
import { ProductsService } from '../products/products.service';
import { TransactionsService } from '../transactions/transactions.service';
import { User } from '../user/user.entity';
import Stripe from 'stripe';
import { CreatePaymentIntentDto } from './dto/request/create-setup-intent.dto';
export declare class StripeService {
    private configService;
    private readonly transactionsService;
    private readonly userRepository;
    private readonly productService;
    private stripe;
    private readonly logger;
    constructor(configService: ConfigService, transactionsService: TransactionsService, userRepository: Model<User>, productService: ProductsService);
    createCustomer(userId: string, firstName: string, lastName: string, phoneNumber: string): Promise<Stripe.Response<Stripe.Customer>>;
    loadProduct(productId: string): Promise<Stripe.Response<Stripe.Product>>;
    loadPrice(priceId: string): Promise<Stripe.Response<Stripe.Price>>;
    createSetupIntent(customer_id: string): Promise<{
        setup_intent: string;
    }>;
    createPaymentIntent(product_id: string, customer_id: string): Promise<Stripe.Response<Stripe.PaymentIntent>>;
    handleWebhook(rawBody: string, signature: string): Promise<{
        received: boolean;
    }>;
    private handlePaymentIntentSucceeded;
    createBuyPhoneNumberPayment(data: CreatePaymentIntentDto): Promise<{
        client_secret: string;
    }>;
}
