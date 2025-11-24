import { Body, Controller, Post, Query } from '@nestjs/common';
import { TwilioService } from './twilio.service';

@Controller('twilio-webhook')
export class TwilioWebhookController {
  constructor() {}

  @Post('webhook')
  async handleWebhook(@Body() body: any, @Query() query: any) {
    console.log('this is the body', body);
    console.log('this is the query', query);
    return { message: 'Webhook received' };
  }
}
