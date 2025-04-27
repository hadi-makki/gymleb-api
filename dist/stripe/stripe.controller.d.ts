import { CreatePaymentIntentDto } from "./dto/request/create-setup-intent.dto";
import { StripeService } from "./stripe.service";
export declare class StripeController {
    private readonly stripeService;
    constructor(stripeService: StripeService);
    getProduct(id: string): Promise<import("stripe").Stripe.Response<import("stripe").Stripe.Product>>;
    handleWebhook(rawBody: string, signature: string): Promise<{
        received: boolean;
    }>;
    createBuyPhoneNumberIntent(data: CreatePaymentIntentDto): Promise<{
        client_secret: string;
    }>;
}
