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
import { GymService } from '../gym/gym.service';
import { checkNodeEnv } from 'src/config/helper/helper-functions';

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
    private readonly gymService: GymService,
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

    const gym = await this.gymService.getGymById(dto.orderId);

    const subscriptionType =
      await this.ownerSubscriptionsService.getSubscriptionTypeById(
        dto.subscriptionTypeId,
      );

    // Get backend and frontend URLs
    const backendUrl =
      this.config.get('WHISH_BACKEND_WEBSITEURL') || this.headers.websiteurl;
    const frontendUrl = checkNodeEnv('production')
      ? this.headers.websiteurl
      : 'http://localhost:3000';

    // Determine redirect URLs based on whether this is a manager payment or public payment
    // For manager payments (gym subscriptions), redirect to dashboard
    // For public payments, redirect to public pages
    // Generate a unique externalId if not provided by the caller
    const generatedExternalId = `${Date.now()}${Math.floor(Math.random() * 1_000_000)}`;
    const externalId = dto.externalId || generatedExternalId;

    const isManagerPayment = !!dto.subscriptionTypeId && !!dto.orderId;
    const successRedirectUrl = isManagerPayment
      ? `${frontendUrl}/dashboard/${dto.orderId}/payment/success?externalId=${externalId}`
      : `${frontendUrl}/payment/whish/success?externalId=${externalId}`;
    const failureRedirectUrl = isManagerPayment
      ? `${frontendUrl}/dashboard/${dto.orderId}/payment/failure?externalId=${externalId}`
      : `${frontendUrl}/payment/whish/failure?externalId=${externalId}`;

    const payload = {
      amount: dto.amount,
      currency: dto.currency || 'USD',
      invoice: dto.invoice || `Order #${externalId}`,
      externalId,
      // callbacks go to backend API without extra params (per WHISH spec)
      successCallbackUrl: `${backendUrl}/api/payment/whish/webhook/success`,
      failureCallbackUrl: `${backendUrl}/api/payment/whish/webhook/failure`,
      // redirects go to appropriate pages
      successRedirectUrl,
      failureRedirectUrl,
    };

    const url = `/payment/whish`;

    this.logger.debug(`Initiating WHISH payment for externalId=${externalId}`);
    this.logger.debug(
      `Payment type: ${isManagerPayment ? 'Manager' : 'Public'}, Success URL: ${successRedirectUrl}, Failure URL: ${failureRedirectUrl}`,
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

    // Persist a pending transaction now, so we can correlate on callback
    const pendingTx = this.repo.create({
      externalId,
      amount: dto.amount,
      currency: dto.currency || 'USD',
      invoice: payload.invoice,
      whishUrl,
      status: 'pending',
      rawResponse: data,
      // Save relations/ids needed for success handling
      // Link gym by id without fetching entity
      gym: gym,
      subscriptionType: subscriptionType,
    });
    await this.repo.save(pendingTx);

    this.logger.log(
      `WHISH payment initiated successfully for externalId=${externalId}, redirecting to: ${whishUrl}`,
    );

    return whishUrl;
  }

  /**
   * Handle webhooks/callbacks from WHISH.
   * Create transaction and assign subscription to gym on success.
   */
  async handleCallback(payload: any): Promise<WhishTransaction | null> {
    // Extract externalId and status from callback
    const externalId = payload.externalId || payload?.data?.externalId;
    const collectStatus =
      payload.collectStatus || payload?.data?.collectStatus || payload?.status;

    if (!externalId) {
      this.logger.warn('WHISH callback missing externalId', payload);
      return null;
    }

    const tx = await this.repo.findOne({
      where: { externalId },
      relations: ['gym', 'subscriptionType'],
    });
    if (!tx) {
      this.logger.warn('WHISH callback for unknown externalId', externalId);
      return null;
    }

    // Map status values
    let newStatus: WhishTransaction['status'] = 'pending';
    if (collectStatus === 'success') newStatus = 'success';
    else if (collectStatus === 'failed') newStatus = 'failed';

    // Update transaction
    tx.status = newStatus;
    tx.rawResponse = payload;
    await this.repo.save(tx);

    // On success, assign subscription to gym
    if (newStatus === 'success' && tx.subscriptionTypeId && tx.gymId) {
      try {
        await this.gymService.setSubscriptionToGym(
          tx.subscriptionTypeId,
          tx.gymId,
          true,
          externalId,
        );
        this.logger.log(
          `Subscription ${tx.subscriptionTypeId} assigned to gym ${tx.gymId} for transaction ${externalId}`,
        );
      } catch (error) {
        this.logger.error(
          `Failed to assign subscription for transaction ${externalId}:`,
          error,
        );
        // Keep transaction as success but log error for manual follow-up
      }
    }

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
        relations: ['gym', 'subscriptionType'],
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
        if (newStatus === 'success' && tx.subscriptionTypeId && tx.gymId) {
          try {
            await this.gymService.setSubscriptionToGym(
              tx.subscriptionTypeId,
              tx.gymId,
              true, // resetNotifications
            );
            this.logger.log(
              `Subscription ${tx.subscriptionType?.title || tx.subscriptionTypeId} assigned to gym ${tx.gymId} via status check for transaction ${externalId}`,
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
      relations: ['gym', 'subscriptionType'],
    });
  }

  /**
   * Get all transactions for a specific owner
   */
  async getTransactionsByOwner(ownerId: string): Promise<WhishTransaction[]> {
    const getAllGymsForOwner = await this.gymService.getGymsByOwner(ownerId);
    const transactions = [];
    for (const gym of getAllGymsForOwner) {
      const transactions = await this.getTransactionsByGym(gym.id);
      transactions.push(...transactions);
    }
    return transactions;
  }

  /**
   * Get all transactions for a specific gym
   */
  async getTransactionsByGym(gymId: string): Promise<WhishTransaction[]> {
    return await this.repo.find({
      where: { gymId },
      relations: ['gym', 'subscriptionType'],
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
