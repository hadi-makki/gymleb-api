import {
  Injectable,
  BadRequestException,
  Inject,
  Logger,
} from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { WhishTransaction } from './entities/whish-transaction.entity';
import { CreateWhishDto } from './dto/create-whish-transaction.dto';
import { OwnerSubscriptionsService } from '../owner-subscriptions/owner-subscriptions.service';

@Injectable()
export class WhishTransactionsService {
  private readonly logger = new Logger(WhishTransactionsService.name);
  private readonly base: string;
  private readonly headers: Record<string, string>;
  private readonly axiosClient: AxiosInstance;

  constructor(
    private readonly config: ConfigService,
    @InjectRepository(WhishTransaction)
    private readonly repo: Repository<WhishTransaction>,
    private readonly ownerSubscriptionsService: OwnerSubscriptionsService,
  ) {
    this.base =
      this.config.get('WHISH_API_BASE') ||
      'https://lb.sandbox.whish.money/itel-service/api';
    // headers required by spec: channel, secret, websiteurl
    this.headers = {
      channel: this.config.get('WHISH_CHANNEL') || '',
      secret: this.config.get('WHISH_SECRET') || '',
      websiteurl: this.config.get('WHISH_WEBSITEURL') || '',
      'Content-Type': 'application/json',
    };

    // Initialize Axios client with base URL
    this.axiosClient = axios.create({
      baseURL: this.base,
      timeout: 15000,
    });
  }

  /**
   * Initiate a Whish payment (POST /payment/whish)
   * Returns the collect/whish URL to redirect the user
   */
  async initiatePayment(dto: CreateWhishDto): Promise<string> {
    // ensure required
    if (
      !this.headers.channel ||
      !this.headers.secret ||
      !this.headers.websiteurl
    ) {
      throw new BadRequestException('WHISH headers not configured.');
    }

    const payload = {
      amount: dto.amount,
      currency: dto.currency || 'USD',
      invoice: dto.invoice || `Order #${dto.externalId}`,
      externalId: dto.externalId,
      // callbacks/redirects - adapt to your front-end routes
      successCallbackUrl: `${this.headers.websiteurl}/api/payment/whish/webhook/success`,
      failureCallbackUrl: `${this.headers.websiteurl}/api/payment/whish/webhook/failure`,
      successRedirectUrl: `${this.headers.websiteurl}/payment/whish/success?externalId=${dto.externalId}`,
      failureRedirectUrl: `${this.headers.websiteurl}/payment/whish/failure?externalId=${dto.externalId}`,
    };

    const url = `/payment/whish`;

    this.logger.debug(
      `Initiating WHISH payment for externalId=${dto.externalId}`,
    );

    let data: any;
    try {
      const resp = await this.axiosClient.post(url, payload, {
        headers: this.headers,
      });
      data = resp.data;
    } catch (err: any) {
      this.logger.error(
        'WHISH initiation request failed',
        err?.response?.data || err.message,
      );
      throw new BadRequestException('Failed to contact WHISH.');
    }

    if (!data?.status) {
      this.logger.warn('WHISH initiation rejected: ' + JSON.stringify(data));
      throw new BadRequestException(
        `Whish initiation failed: ${JSON.stringify(data)}`,
      );
    }

    const whishUrl = data.data?.whishUrl || data.data?.collectUrl;
    if (!whishUrl) {
      this.logger.warn(
        'Whish URL missing in response: ' + JSON.stringify(data),
      );
      throw new BadRequestException(
        `Whish URL missing in response: ${JSON.stringify(data)}`,
      );
    }

    // persist transaction
    const tx = this.repo.create({
      externalId: dto.externalId,
      orderId: dto.orderId,
      amount: dto.amount,
      currency: dto.currency || 'USD',
      invoice: payload.invoice,
      whishUrl,
      status: 'pending',
      rawResponse: data,
      ownerId: dto.ownerId,
      subscriptionTypeId: dto.subscriptionTypeId,
    });
    await this.repo.save(tx);

    return whishUrl;
  }

  /**
   * Handle webhooks/callbacks from WHISH.
   * Update transaction status and return the stored transaction.
   */
  async handleCallback(payload: any): Promise<WhishTransaction | null> {
    // The spec describes callback URLs but does not define exact payload structure,
    // typical fields: externalId, collectStatus
    const externalId = payload.externalId || payload?.data?.externalId;
    const collectStatus =
      payload.collectStatus || payload?.data?.collectStatus || payload?.status;

    if (!externalId) {
      this.logger.warn('WHISH callback missing externalId', payload);
      return null;
    }

    const tx = await this.repo.findOne({
      where: { externalId },
      relations: ['owner', 'subscriptionType'],
    });
    if (!tx) {
      this.logger.warn('WHISH callback for unknown externalId', externalId);
      return null;
    }

    // map status values
    let newStatus: WhishTransaction['status'] = 'pending';
    if (collectStatus === 'success') newStatus = 'success';
    else if (collectStatus === 'failed') newStatus = 'failed';
    // else keep pending

    tx.status = newStatus;
    tx.rawResponse = payload;
    await this.repo.save(tx);

    // If payment successful and we have subscription info, assign it to the gym
    if (newStatus === 'success' && tx.subscriptionTypeId && tx.orderId) {
      try {
        await this.ownerSubscriptionsService.setSubscriptionToGym(
          tx.subscriptionTypeId,
          tx.orderId, // orderId is gymId
        );
        this.logger.log(
          `Subscription ${tx.subscriptionType?.title || tx.subscriptionTypeId} assigned to gym ${tx.orderId} for transaction ${externalId}`,
        );
      } catch (error) {
        this.logger.error(
          `Failed to assign subscription for transaction ${externalId}:`,
          error,
        );
        // You may want to mark the transaction for manual review or retry
      }
    }

    // you may want to emit events, notify order service, etc.
    this.logger.log(
      `WHISH callback processed for externalId=${externalId} status=${newStatus}`,
    );

    return tx;
  }

  /**
   * Query WHISH for collect status (POST /payment/collect/status)
   */
  async getCollectStatus(externalId: string, currency = 'USD'): Promise<any> {
    if (!externalId) throw new BadRequestException('externalId is required');

    const url = `/payment/collect/status`;
    const payload = { externalId, currency };

    let data: any;
    try {
      const resp = await this.axiosClient.post(url, payload, {
        headers: this.headers,
      });
      data = resp.data;
    } catch (err: any) {
      this.logger.error(
        'WHISH status request failed',
        err?.response?.data || err.message,
      );
      throw new BadRequestException('Failed to get status from WHISH.');
    }

    if (!data?.status) {
      this.logger.warn(
        'WHISH status returned failure: ' + JSON.stringify(data),
      );
      throw new BadRequestException(
        `Whish status failed: ${JSON.stringify(data)}`,
      );
    }

    // update local transaction if present
    const collectStatus = data.data?.collectStatus;
    if (collectStatus) {
      const tx = await this.repo.findOne({
        where: { externalId },
        relations: ['owner', 'subscriptionType'],
      });
      if (tx) {
        const newStatus =
          collectStatus === 'success'
            ? 'success'
            : collectStatus === 'failed'
              ? 'failed'
              : 'pending';

        tx.status = newStatus;
        tx.rawResponse = data;
        await this.repo.save(tx);

        // If payment successful and we have subscription info, assign it to the gym
        if (newStatus === 'success' && tx.subscriptionTypeId && tx.orderId) {
          try {
            await this.ownerSubscriptionsService.setSubscriptionToGym(
              tx.subscriptionTypeId,
              tx.orderId, // orderId is gymId
            );
            this.logger.log(
              `Subscription ${tx.subscriptionType?.title || tx.subscriptionTypeId} assigned to gym ${tx.orderId} via status check for transaction ${externalId}`,
            );
          } catch (error) {
            this.logger.error(
              `Failed to assign subscription via status check for transaction ${externalId}:`,
              error,
            );
          }
        }
      }
    }

    return data;
  }

  /**
   * Get transaction with full relations for debugging/admin purposes
   */
  async getTransactionByExternalId(
    externalId: string,
  ): Promise<WhishTransaction | null> {
    return await this.repo.findOne({
      where: { externalId },
      relations: ['owner', 'subscriptionType'],
    });
  }

  /**
   * Get all transactions for a specific owner
   */
  async getTransactionsByOwner(ownerId: string): Promise<WhishTransaction[]> {
    return await this.repo.find({
      where: { ownerId },
      relations: ['subscriptionType'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Get account balance from WHISH
   * GET /payment/account/balance
   */
  async getAccountBalance(): Promise<any> {
    if (
      !this.headers.channel ||
      !this.headers.secret ||
      !this.headers.websiteurl
    ) {
      throw new BadRequestException('WHISH headers not configured.');
    }

    const url = `/payment/account/balance`;

    let data: any;
    try {
      const resp = await this.axiosClient.get(url, {
        headers: this.headers,
      });
      data = resp.data;
    } catch (err: any) {
      this.logger.error(
        'WHISH balance request failed',
        err?.response?.data || err.message,
      );
      throw new BadRequestException('Failed to get balance from WHISH.');
    }

    if (!data?.status) {
      this.logger.warn(
        'WHISH balance returned failure: ' + JSON.stringify(data),
      );
      throw new BadRequestException(
        `Whish balance failed: ${JSON.stringify(data)}`,
      );
    }

    return data;
  }
}
