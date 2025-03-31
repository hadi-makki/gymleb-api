import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
  RawBody
} from "@nestjs/common";
import {
  ApiCreatedResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse
} from "@nestjs/swagger";
import { CreatePaymentIntentDto } from "./dto/request/create-setup-intent.dto";
import { PaymentIntentResDto } from "./dto/response/payment-intent-res.dto";
import { StripeService } from "./stripe.service";

@Controller("stripe")
@ApiTags("stripe")
export class StripeController {
  constructor(private readonly stripeService: StripeService) {}
  @Get(":id")
  async getProduct(@Param("id") id: string) {
    return this.stripeService.loadProduct(id);
  }
  @Post("webhook")
  async handleWebhook(
    @RawBody() rawBody: string,
    @Headers("stripe-signature") signature: string
  ) {
    try {
      // Verify the Stripe signature
      const webhookEvent = await this.stripeService.handleWebhook(
        rawBody,
        signature
      );
      return webhookEvent;
    } catch (err) {
      console.error(`Webhook signature verification failed:`, err.message);
      return;
    }
  }
  @Post("create-intent-session")
  @ApiOperation({
    summary: "Get current subscription plan",
    description: "",
  })
  @ApiUnauthorizedResponse()
  @ApiCreatedResponse({ type: PaymentIntentResDto })
  async createBuyPhoneNumberIntent(@Body() data: CreatePaymentIntentDto) {
    return await this.stripeService.createBuyPhoneNumberPayment(data);
  }
}
