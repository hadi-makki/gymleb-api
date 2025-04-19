import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config/dist/config.service';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BadRequestException } from 'src/error/bad-request-error';
import { NotFoundException } from 'src/error/not-found-error';
import { ProductsService } from 'src/products/products.service';
import { TransactionsService } from 'src/transactions/transactions.service';
import { User } from 'src/user/user.entity';
import Stripe from 'stripe';
import {
  CallWith,
  CreatePaymentIntentDto,
} from './dto/request/create-setup-intent.dto';
import { PaymentDetails } from './stripe.interface';
@Injectable()
export class StripeService {
  private stripe: Stripe;
  private readonly logger = new Logger(StripeService.name);
  constructor(
    private configService: ConfigService,
    private readonly transactionsService: TransactionsService,
    @InjectModel(User.name)
    private readonly userRepository: Model<User>,
    private readonly productService: ProductsService,
  ) {
    this.stripe = new Stripe(this.configService.get('STRIPE_SECRET_KEY'));
  }
  async createCustomer(
    userId: string,
    firstName: string,
    lastName: string,
    phoneNumber: string,
  ) {
    const customer = this.stripe.customers.create({
      name: `${firstName} ${lastName}`,
      phone: phoneNumber,
      metadata: { userId },
    });

    return customer;
  }
  async loadProduct(productId: string) {
    return await this.stripe.products.retrieve(productId);
  }
  async loadPrice(priceId: string) {
    return this.stripe.prices.retrieve(priceId);
  }
  async createSetupIntent(customer_id: string) {
    const setup_intent = this.stripe.setupIntents.create({
      customer: customer_id,
      payment_method_types: ['card'],
    });
    return { setup_intent: (await setup_intent).id };
  }
  async createPaymentIntent(product_id: string, customer_id: string) {
    const product = await this.loadProduct(product_id);
    const price = await this.loadPrice(String(product.default_price));
    console.log('product price:', price);
    const paymentIntent = await this.stripe.paymentIntents.create({
      amount: price.unit_amount,
      payment_method_types: ['card'],
      currency: 'usd',
      customer: customer_id,
      metadata: { product_id: product_id },
    });
    return paymentIntent;
  }

  async handleWebhook(rawBody: string, signature: string) {
    const event = JSON.parse(rawBody);
    try {
      // Verify the webhook signature
      // Handle different event types
      switch (event.type) {
        case 'payment_intent.succeeded':
          const paymentIntent = event.data.object as Stripe.PaymentIntent;
          console.log('we are in the payment intent succeeded:', paymentIntent);

          // Handle successful payment
          await this.handlePaymentIntentSucceeded(
            event.data.object as Stripe.PaymentIntent,
          );
          break;
      }

      return { received: true };
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message);
      throw new BadRequestException(`Webhook Error: ${err.message}`);
    }
  }
  /// handle renew subscriptions
  private async handlePaymentIntentSucceeded(
    paymentIntent: Stripe.PaymentIntent,
  ) {
    // // Fetch additional customer details
    // const customer = paymentIntent.customer
    //   ? ((await this.stripe.customers.retrieve(
    //       paymentIntent.customer as string,
    //     )) as Stripe.Customer)
    //   : null;
    // // Fetch payment method details
    // const paymentMethod = paymentIntent.payment_method
    //   ? await this.stripe.paymentMethods.retrieve(
    //       paymentIntent.payment_method as string,
    //     )
    //   : null;
    // // Get the associated invoice if it exists
    // const invoice = paymentIntent.invoice
    //   ? await this.stripe.invoices.retrieve(paymentIntent.invoice as string)
    //   : null;
    // const paymentDetails: PaymentDetails = {
    //   subscriptionId: invoice?.subscription as string,
    //   invoiceId: invoice?.id || null,
    //   customerId: customer?.id || 'guest',
    //   amount: paymentIntent.amount / 100, // Convert from cents to dollars
    //   currency: paymentIntent.currency,
    //   paymentMethod: paymentMethod?.type || 'unknown',
    //   products: [], // Will be populated if there's an invoice
    //   metadata: paymentIntent.metadata as unknown as {
    //     productId: string;
    //     userId: string;
    //     callWith: CallWith;
    //     callDuration: number;
    //   },
    //   status: paymentIntent.status,
    //   created: new Date(paymentIntent.created * 1000),
    // };
    // // If there's an invoice, get the line items
    // if (invoice) {
    //   paymentDetails.products = invoice.lines.data.map((item) => ({
    //     name: item.description || 'Unnamed product',
    //     quantity: item.quantity || 1,
    //     productId: item.price?.product as string,
    //     price: (item.amount || 0) / 100, // Convert from cents to dollars
    //   }));
    // }
    // this.logger.log('Payment Intent Succeeded Summarized:', {
    //   ...paymentDetails,
    //   raw_payment_intent_id: paymentIntent.id,
    // });
    // // Here you would typically:
    // // 1. Update your database with the payment information
    // // 2. Send confirmation emails
    // // 3. Update inventory
    // // 4. Trigger any necessary fulfillment processes
    // await this.transactionsService.createAiPhoneNumberTransaction(
    //   paymentDetails,
    // );
    // return paymentDetails;
  }

  async createBuyPhoneNumberPayment(data: CreatePaymentIntentDto) {
    let user: User;

    const checkUser = await this.userRepository.findById(data.phoneNumber);
    if (checkUser) {
      user = checkUser;
    } else {
      const createUser = await this.userRepository.create({
        phoneNumber: data.phoneNumber,
        name: data.fullName,
        email: data.email,
      });

      user = createUser;
    }
    const getProduct = await this.productService.getProductById(data.product);
    if (!getProduct) {
      throw new NotFoundException('Product not found');
    }

    const phoneNumberProduct = await this.loadProduct(
      getProduct.stripeProductId,
    );
    const price = await this.loadPrice(
      String(phoneNumberProduct.default_price),
    );
    const firstName = user.name.split(' ')[0];
    const lastName = user.name.split(' ')[1];
    const customerId = (
      await this.createCustomer(user.id, firstName, lastName, user.id)
    ).id;
    const paymentIntent = await this.stripe.paymentIntents.create({
      amount: price.unit_amount,
      // payment_method_types: ["card", "google_pay"],
      currency: 'usd',
      customer: customerId,
      metadata: {
        productId: phoneNumberProduct.id,
        userId: user.id,
        callWith: data.callWith,
        callDuration: getProduct.maxDurationSeconds,
      } as {
        productId: string;
        userId: string;
        callWith: CallWith;
        callDuration: number;
      },
    });
    return {
      client_secret: paymentIntent.client_secret,
    };
  }
}
