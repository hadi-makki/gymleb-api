import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { Cron, CronExpression, SchedulerRegistry } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { GymEntity } from 'src/gym/entities/gym.entity';
import { MemberEntity } from 'src/member/entities/member.entity';
import { TransactionEntity } from 'src/transactions/transaction.entity';
import { Repository } from 'typeorm';
import { MemberService } from '../member/member.service';
import { TwilioService } from '../twilio/twilio.service';
import { addDays } from 'date-fns';
import { RequestLogsService } from '../request-logs/request-logs.service';
import { LogType } from '../request-logs/request-log.entity';

@Injectable()
export class CronService implements OnApplicationBootstrap {
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
    private readonly schedulerRegistry: SchedulerRegistry,
    private readonly requestLogsService: RequestLogsService,
  ) {}

  private async logCronError(
    cronName: string,
    error: Error,
    additionalData?: any,
  ) {
    try {
      await this.requestLogsService.create({
        method: 'CRON',
        url: `cron://${cronName}`,
        statusCode: 500,
        durationMs: 0,
        deviceId: null,
        ip: null,
        country: null,
        city: null,
        headers: null,
        requestBody: additionalData ? JSON.stringify(additionalData) : null,
        queryParams: null,
        routeParams: null,
        isError: true,
        isSlow: false,
        resolveStatus: 'pending' as any,
        logType: LogType.CRON,
      });
    } catch (logError) {
      this.logger.error('Failed to log cron error:', logError);
    }
  }

  onApplicationBootstrap() {
    const logCrons = () => {
      const crons = this.schedulerRegistry.getCronJobs();
      if (!crons || crons.size === 0) {
        this.logger.log('No cron jobs registered.');
        return false;
      }
      this.logger.log(
        `Registered cron jobs: ${Array.from(crons.keys()).join(', ')}`,
      );
      crons.forEach((job, name) => {
        try {
          const anyJob = job as any;
          let nextDate: Date | undefined;

          // 1) Prefer nextDate()/nextDates() if available
          if (typeof anyJob.nextDate === 'function') {
            const nd = anyJob.nextDate();
            nextDate =
              nd instanceof Date
                ? nd
                : typeof nd?.toDate === 'function'
                  ? nd.toDate()
                  : undefined;
          }
          if (!nextDate && typeof anyJob.nextDates === 'function') {
            const nd = anyJob.nextDates(1);
            nextDate =
              nd instanceof Date
                ? nd
                : typeof nd?.toDate === 'function'
                  ? nd.toDate()
                  : undefined;
          }

          // 2) Try cronTime.sendAt() from cron library
          if (
            !nextDate &&
            anyJob.cronTime &&
            typeof anyJob.cronTime.sendAt === 'function'
          ) {
            const sent = anyJob.cronTime.sendAt();
            nextDate =
              sent instanceof Date
                ? sent
                : typeof sent?.toDate === 'function'
                  ? sent.toDate()
                  : undefined;
          }

          // 3) Fallback: internal timer's remaining timeout
          if (
            !nextDate &&
            anyJob._timeout &&
            typeof anyJob._timeout._idleTimeout === 'number' &&
            anyJob._timeout._idleTimeout > 0
          ) {
            nextDate = new Date(Date.now() + anyJob._timeout._idleTimeout);
          }

          const iso = nextDate ? nextDate.toISOString() : 'unknown';
          const beirut = nextDate
            ? new Intl.DateTimeFormat('en-GB', {
                timeZone: 'Asia/Beirut',
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false,
              }).format(nextDate)
            : 'unknown';
          this.logger.log(
            `Cron '${name}' next run at: ${iso} (Beirut: ${beirut})`,
          );
        } catch {
          this.logger.log(`Cron '${name}' next run time unavailable.`);
        }
      });
      return true;
    };

    // Try immediately, then retry shortly after bootstrap if empty
    if (!logCrons()) {
      setTimeout(() => {
        logCrons();
      }, 1000);
    }
  }

  @Cron('0 10-20/2 * * *', {
    // @Cron(CronExpression.EVERY_10_SECONDS, {
    name: 'notify-monthly-members-reminder',
    timeZone: 'Asia/Beirut', // Lebanon timezone
  })
  async notifyMonthlyMembersReminder() {
    try {
      // await this.memberService.notifyMembersWithExpiringSubscriptions();
      this.logger.log('Monthly members reminder cron completed successfully');
    } catch (error) {
      this.logger.error('Monthly members reminder cron failed:', error);
      await this.logCronError(
        'notify-monthly-members-reminder',
        error as Error,
      );
    }
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
    try {
      const gyms = await this.gymModel.find({
        where: { enableBirthdayAutomation: true },
        relations: { ownerSubscriptionType: true },
      });
      for (const gym of gyms) {
        await this.memberService.processBirthdayAutomationForGym(gym);
      }
      this.logger.log(
        `Birthday automation cron completed successfully for ${gyms.length} gyms`,
      );
    } catch (error) {
      this.logger.error('Birthday automation cron failed:', error);
      await this.logCronError('birthday-automation', error as Error);
    }
  }

  @Cron(CronExpression.EVERY_HOUR, {
    name: 'check-expired-members',
    timeZone: 'Asia/Beirut',
  })
  async checkExpiredMembers() {
    try {
      await this.memberService.syncExpiredMembersFlag();
      this.logger.log('Check expired members cron completed successfully');
    } catch (error) {
      this.logger.error('Check expired members cron failed:', error);
      await this.logCronError('check-expired-members', error as Error);
    }
  }
}
