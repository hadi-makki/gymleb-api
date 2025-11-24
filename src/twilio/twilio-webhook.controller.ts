import { Body, Controller, Post } from '@nestjs/common';
import { TwilioService } from './twilio.service';

@Controller('twilio-webhook')
export class TwilioWebhookController {
  constructor() {}

  @Post('webhook')
  async handleWebhook(@Body() body: any) {
    console.log('this is the body', body);
    return { message: 'Webhook received' };
  }
}
