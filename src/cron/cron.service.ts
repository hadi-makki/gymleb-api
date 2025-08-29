import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Member } from '../member/entities/member.model';
import { TwilioService } from '../twilio/twilio.service';
import { MemberService } from '../member/member.service';
import {
  Transaction,
  TransactionType,
} from '../transactions/transaction.model';
import { Gym } from '../gym/entities/gym.model';
import { addDays, startOfDay, endOfDay } from 'date-fns';
import { InjectRepository } from '@nestjs/typeorm';
import { MemberEntity } from 'src/member/entities/member.entity';
import { Repository } from 'typeorm';
import { TransactionEntity } from 'src/transactions/transaction.entity';
import { GymEntity } from 'src/gym/entities/gym.entity';

@Injectable()
export class CronService {
  private readonly logger = new Logger(CronService.name);

  constructor(
    @InjectRepository(MemberEntity)
    private readonly memberModel: Repository<MemberEntity>,
    @InjectRepository(TransactionEntity)
    private readonly transactionModel: Repository<TransactionEntity>,
    @InjectRepository(GymEntity)
    private readonly gymModel: Repository<GymEntity>,
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
