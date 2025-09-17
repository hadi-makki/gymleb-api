import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Logger,
  Get,
  Param,
  Query,
} from '@nestjs/common';
import { WhishTransactionsService } from './whish-transactions.service';
import { WhishCallbackDto } from './dto/whish-callback.dto';
import { CreateWhishDto } from './dto/create-whish-transaction.dto';

@Controller('api/payment/whish')
export class WhishTransactionsController {
  private readonly logger = new Logger(WhishTransactionsController.name);

  constructor(private readonly service: WhishTransactionsService) {}

  /**
   * POST /api/payment/whish/initiate
   * Creates a WHISH payment and returns redirect URL
   */
  @Post('initiate')
  async initiate(@Body() dto: CreateWhishDto) {
    this.logger.log(`Initiate request externalId=${dto.externalId}`);
    const url = await this.service.initiatePayment(dto);
    return { success: true, url };
  }

  /**
   * These endpoints are the callback URLs you pass to WHISH (success/failure).
   * According to WHISH documentation, these should be GET callbacks.
   * Respond 200 quickly.
   */

  @Get('webhook/success')
  @HttpCode(HttpStatus.OK)
  async webhookSuccess(@Query() query: any) {
    this.logger.log('WHISH webhook success received', JSON.stringify(query));
    await this.service.handleCallback(query);
    // WHISH does not require any special response per spec; just return 200
    return { status: 'ok' };
  }

  @Get('webhook/failure')
  @HttpCode(HttpStatus.OK)
  async webhookFailure(@Query() query: any) {
    this.logger.log('WHISH webhook failure received', JSON.stringify(query));
    await this.service.handleCallback(query);
    return { status: 'ok' };
  }

  /**
   * Optional: endpoint for manual status check from your side
   * GET /api/payment/whish/status/:externalId?currency=USD
   */
  @Get('status/:externalId')
  async status(
    @Param('externalId') externalId: string,
    @Query('currency') currency = 'USD',
  ) {
    this.logger.log(`Status check externalId=${externalId}`);
    const data = await this.service.getCollectStatus(externalId, currency);
    return data;
  }

  /**
   * Get transaction details with relations
   * GET /api/payment/whish/transaction/:externalId
   */
  @Get('transaction/:externalId')
  async getTransaction(@Param('externalId') externalId: string) {
    this.logger.log(`Get transaction externalId=${externalId}`);
    const transaction =
      await this.service.getTransactionByExternalId(externalId);
    if (!transaction) {
      return { success: false, message: 'Transaction not found' };
    }
    return { success: true, data: transaction };
  }

  /**
   * Get all transactions for an owner
   * GET /api/payment/whish/owner/:ownerId/transactions
   */
  @Get('owner/:ownerId/transactions')
  async getOwnerTransactions(@Param('ownerId') ownerId: string) {
    this.logger.log(`Get transactions for owner=${ownerId}`);
    const transactions = await this.service.getTransactionsByOwner(ownerId);
    return { success: true, data: transactions };
  }

  /**
   * Get account balance from WHISH
   * GET /api/payment/whish/balance
   */
  @Get('balance')
  async getBalance() {
    this.logger.log('Get WHISH account balance');
    const balance = await this.service.getAccountBalance();
    return balance;
  }
}
