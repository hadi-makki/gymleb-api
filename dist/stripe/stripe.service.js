"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var StripeService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.StripeService = void 0;
const common_1 = require("@nestjs/common");
const config_service_1 = require("@nestjs/config/dist/config.service");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const bad_request_error_1 = require("../error/bad-request-error");
const not_found_error_1 = require("../error/not-found-error");
const products_service_1 = require("../products/products.service");
const transactions_service_1 = require("../transactions/transactions.service");
const user_entity_1 = require("../user/user.entity");
const stripe_1 = require("stripe");
let StripeService = StripeService_1 = class StripeService {
    constructor(configService, transactionsService, userRepository, productService) {
        this.configService = configService;
        this.transactionsService = transactionsService;
        this.userRepository = userRepository;
        this.productService = productService;
        this.logger = new common_1.Logger(StripeService_1.name);
        this.stripe = new stripe_1.default(this.configService.get('STRIPE_SECRET_KEY'));
    }
    async createCustomer(userId, firstName, lastName, phoneNumber) {
        const customer = this.stripe.customers.create({
            name: `${firstName} ${lastName}`,
            phone: phoneNumber,
            metadata: { userId },
        });
        return customer;
    }
    async loadProduct(productId) {
        return await this.stripe.products.retrieve(productId);
    }
    async loadPrice(priceId) {
        return this.stripe.prices.retrieve(priceId);
    }
    async createSetupIntent(customer_id) {
        const setup_intent = this.stripe.setupIntents.create({
            customer: customer_id,
            payment_method_types: ['card'],
        });
        return { setup_intent: (await setup_intent).id };
    }
    async createPaymentIntent(product_id, customer_id) {
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
    async handleWebhook(rawBody, signature) {
        const event = JSON.parse(rawBody);
        try {
            switch (event.type) {
                case 'payment_intent.succeeded':
                    const paymentIntent = event.data.object;
                    console.log('we are in the payment intent succeeded:', paymentIntent);
                    await this.handlePaymentIntentSucceeded(event.data.object);
                    break;
            }
            return { received: true };
        }
        catch (err) {
            console.error('Webhook signature verification failed:', err.message);
            throw new bad_request_error_1.BadRequestException(`Webhook Error: ${err.message}`);
        }
    }
    async handlePaymentIntentSucceeded(paymentIntent) {
    }
    async createBuyPhoneNumberPayment(data) {
        let user;
        const checkUser = await this.userRepository.findById(data.phoneNumber);
        if (checkUser) {
            user = checkUser;
        }
        else {
            const createUser = await this.userRepository.create({
                phoneNumber: data.phoneNumber,
                name: data.fullName,
                email: data.email,
            });
            user = createUser;
        }
        const getProduct = await this.productService.getProductById(data.product);
        if (!getProduct) {
            throw new not_found_error_1.NotFoundException('Product not found');
        }
        const phoneNumberProduct = await this.loadProduct(getProduct.stripeProductId);
        const price = await this.loadPrice(String(phoneNumberProduct.default_price));
        const firstName = user.name.split(' ')[0];
        const lastName = user.name.split(' ')[1];
        const customerId = (await this.createCustomer(user.id, firstName, lastName, user.id)).id;
        const paymentIntent = await this.stripe.paymentIntents.create({
            amount: price.unit_amount,
            currency: 'usd',
            customer: customerId,
            metadata: {
                productId: phoneNumberProduct.id,
                userId: user.id,
                callWith: data.callWith,
                callDuration: getProduct.maxDurationSeconds,
            },
        });
        return {
            client_secret: paymentIntent.client_secret,
        };
    }
};
exports.StripeService = StripeService;
exports.StripeService = StripeService = StripeService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(2, (0, mongoose_1.InjectModel)(user_entity_1.User.name)),
    __metadata("design:paramtypes", [config_service_1.ConfigService,
        transactions_service_1.TransactionsService,
        mongoose_2.Model,
        products_service_1.ProductsService])
], StripeService);
//# sourceMappingURL=stripe.service.js.map