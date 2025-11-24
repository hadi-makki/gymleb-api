import { Body, Controller, Post, Query } from '@nestjs/common';
import { TwilioService } from './twilio.service';

@Controller('twilio-webhook')
export class TwilioWebhookController {
  constructor() {}

  @Post('/verify-message-status')
  async verifyMessageStatus(
    @Body() body: any,
    @Query('memberId') memberId: string,
    @Query('transactionId') transactionId: string,
  ) {
    console.log('this is the body', body);
    return { message: 'Message status verified' };
  }
}
