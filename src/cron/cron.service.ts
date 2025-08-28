import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Member } from '../member/entities/member.entity';
import { TwilioService } from '../twilio/twilio.service';
import { MemberService } from '../member/member.service';
import {
  Transaction,
  TransactionType,
} from '../transactions/transaction.entity';
import { Gym } from '../gym/entities/gym.model';
import { addDays, startOfDay, endOfDay } from 'date-fns';

@Injectable()
export class CronService {
  private readonly logger = new Logger(CronService.name);

  constructor(
    @InjectModel(Member.name)
    private readonly memberModel: Model<Member>,
    @InjectModel(Transaction.name)
    private readonly transactionModel: Model<Transaction>,
    @InjectModel(Gym.name)
    private readonly gymModel: Model<Gym>,
    private readonly twilioService: TwilioService,
    private readonly memberService: MemberService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_10AM, {
    name: 'notify-expired-members',
    timeZone: 'Asia/Beirut', // Lebanon timezone
  })
  async notifyExpiredMembers() {
    this.logger.log('Starting expired members notification cron job');

    await this.memberService.notifyMembersWithExpiringSubscriptions();
  }
}
