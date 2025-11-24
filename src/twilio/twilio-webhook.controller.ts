import { Body, Controller, Post, Query } from '@nestjs/common';
import { TwilioService } from './twilio.service';

@Controller('twilio-webhook')
export class TwilioWebhookController {
  constructor(private readonly twilioService: TwilioService) {}

  @Post('/verify-message-status')
  async verifyMessageStatus(
    @Body() body: any,
    @Query('memberId') memberId: string,
    @Query('transactionId') transactionId: string,
  ) {
    await this.twilioService.verifyMessageStatus({
      memberId,
      transactionId,
      messageStatus: body.MessageStatus,
      MessageSid: body.MessageSid,
      errorCode: body.ErrorCode,
    });
    return { message: 'Message status verified' };
  }
}
