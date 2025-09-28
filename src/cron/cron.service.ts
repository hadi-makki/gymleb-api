import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { GymEntity } from 'src/gym/entities/gym.entity';
import { MemberEntity } from 'src/member/entities/member.entity';
import { TransactionEntity } from 'src/transactions/transaction.entity';
import { Repository } from 'typeorm';
import { MemberService } from '../member/member.service';
import { TwilioService } from '../twilio/twilio.service';
import { addDays } from 'date-fns';

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

  @Cron('0 7-23/4 * * *', {
    name: 'notify-expired-members',
    timeZone: 'Asia/Beirut', // Lebanon timezone
  })
  async notifyExpiredMembers() {
    await this.memberService.notifyMembersWithExpiringSubscriptions();
  }

  // @Cron('0 7-23/4 * * *', {
  //   name: 'notify-expired-members-reminder',
  //   timeZone: 'Asia/Beirut', // Lebanon timezone
  // })
  // async notifyExpiredMembersReminder() {
  //   await this.memberService.notifyMembersWithExpiringSubscriptionsReminder();
  // }

  @Cron('0 9 * * *', {
    name: 'birthday-automation',
    timeZone: 'Asia/Beirut',
  })
  async processBirthdays() {
    const gyms = await this.gymModel.find({
      where: { enableBirthdayAutomation: true },
      relations: { ownerSubscriptionType: true },
    });
    for (const gym of gyms) {
      await this.memberService.processBirthdayAutomationForGym(gym);
    }
  }
}
