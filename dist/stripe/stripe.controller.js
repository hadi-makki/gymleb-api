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
Object.defineProperty(exports, "__esModule", { value: true });
exports.StripeController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const create_setup_intent_dto_1 = require("./dto/request/create-setup-intent.dto");
const payment_intent_res_dto_1 = require("./dto/response/payment-intent-res.dto");
const stripe_service_1 = require("./stripe.service");
let StripeController = class StripeController {
    constructor(stripeService) {
        this.stripeService = stripeService;
    }
    async getProduct(id) {
        return this.stripeService.loadProduct(id);
    }
    async handleWebhook(rawBody, signature) {
        try {
            const webhookEvent = await this.stripeService.handleWebhook(rawBody, signature);
            return webhookEvent;
        }
        catch (err) {
            console.error(`Webhook signature verification failed:`, err.message);
            return;
        }
    }
    async createBuyPhoneNumberIntent(data) {
        return await this.stripeService.createBuyPhoneNumberPayment(data);
    }
};
exports.StripeController = StripeController;
__decorate([
    (0, common_1.Get)(":id"),
    __param(0, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], StripeController.prototype, "getProduct", null);
__decorate([
    (0, common_1.Post)("webhook"),
    __param(0, (0, common_1.RawBody)()),
    __param(1, (0, common_1.Headers)("stripe-signature")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], StripeController.prototype, "handleWebhook", null);
__decorate([
    (0, common_1.Post)("create-intent-session"),
    (0, swagger_1.ApiOperation)({
        summary: "Get current subscription plan",
        description: "",
    }),
    (0, swagger_1.ApiUnauthorizedResponse)(),
    (0, swagger_1.ApiCreatedResponse)({ type: payment_intent_res_dto_1.PaymentIntentResDto }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_setup_intent_dto_1.CreatePaymentIntentDto]),
    __metadata("design:returntype", Promise)
], StripeController.prototype, "createBuyPhoneNumberIntent", null);
exports.StripeController = StripeController = __decorate([
    (0, common_1.Controller)("stripe"),
    (0, swagger_1.ApiTags)("stripe"),
    __metadata("design:paramtypes", [stripe_service_1.StripeService])
], StripeController);
//# sourceMappingURL=stripe.controller.js.map