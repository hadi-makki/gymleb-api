import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { CronModule } from './cron/cron.module';
import { DatabaseModule } from './database/database.module';
import { ExpenseEntity } from './expenses/expense.entity';
import { ExpensesModule } from './expenses/expenses.module';
import { GymOwnerModule } from './gym-owner/gym-owner.module';
import { GymEntity } from './gym/entities/gym.entity';
import { GymModule } from './gym/gym.module';
import { LoggerMiddleware } from './logger/logger.service';
import { RequestLogEntity } from './request-logs/request-log.entity';
import { RequestLogsModule } from './request-logs/request-logs.module';
import { ManagerEntity } from './manager/manager.entity';
import { ManagerModule } from './manager/manager.module';
import { MediaEntity } from './media/media.entity';
import { MediaModule } from './media/media.module';
import { MemberEntity } from './member/entities/member.entity';
import { MemberAttendingDaysEntity } from './member/entities/member-attending-days.entity';
import { MemberModule } from './member/member.module';
import { DeviceIdMiddleware } from './middleware/device-id.middleware';
import { OwnerSubscriptionTypeEntity } from './owner-subscriptions/owner-subscription-type.entity';
import { OwnerSubscriptionsModule } from './owner-subscriptions/owner-subscriptions.module';
import { PTSessionEntity } from './personal-trainers/entities/pt-sessions.entity';
import { PersonalTrainersModule } from './personal-trainers/personal-trainers.module';
import { ProductEntity } from './products/products.entity';
import { ProductsModule } from './products/products.module';
import { RevenueEntity } from './revenue/revenue.entity';
import { RevenueModule } from './revenue/revenue.module';
import { S3Module } from './s3/s3.module';
import { GymSeeding } from './seeder/gym.seeding';
import { ManagerSeeding } from './seeder/managers.seeding';
import { StaffModule } from './staff/staff.module';
import { SubscriptionEntity } from './subscription/entities/subscription.entity';
import { SubscriptionModule } from './subscription/subscription.module';
import { TokenEntity } from './token/token.entity';
import { TokenModule } from './token/token.module';
import { TransactionModule } from './transactions/transaction.module';
import { TransactionEntity } from './transactions/transaction.entity';
import { TwilioModule } from './twilio/twilio.module';
import { AiChatEntity } from './ai-chat/entities/ai-chat.entity';
import { UserModule } from './user/user.module';
import { AiChatModule } from './ai-chat/ai-chat.module';
import { NotificationSettingsModule } from './notification-settings/notification-settings.module';
import { ManagerNotificationSettingsModule } from './manager-notification-settings/manager-notification-settings.module';
import { WhishTransactionsModule } from './whish-transactions/whish-transactions.module';
import { DatabaseMigration } from './database.migration';

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // Time window in milliseconds (1 minute)
        limit: 100, // Maximum number of requests per ttl window
      },
    ]),

    TypeOrmModule.forFeature([
      ManagerEntity,
      GymEntity,
      OwnerSubscriptionTypeEntity,
      TokenEntity,
      MemberEntity,
      MemberAttendingDaysEntity,
      MediaEntity,
      ExpenseEntity,
      RevenueEntity,
      ProductEntity,
      SubscriptionEntity,
      TransactionEntity,
      PTSessionEntity,
      AiChatEntity,
      RequestLogEntity,
    ]),
    ConfigModule,
    DatabaseModule,
    MediaModule,
    S3Module,
    UserModule,
    AuthModule,
    TokenModule,
    ManagerModule,
    // StripeModule,
    TransactionModule,
    PersonalTrainersModule,
    SubscriptionModule,
    GymModule,
    MemberModule,
    TwilioModule,
    ExpensesModule,
    RevenueModule,
    OwnerSubscriptionsModule,
    GymOwnerModule,
    ProductsModule,
    StaffModule,
    CronModule,
    AiChatModule,
    NotificationSettingsModule,
    ManagerNotificationSettingsModule,
    WhishTransactionsModule,
    RequestLogsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    ManagerSeeding,
    GymSeeding,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    DatabaseMigration,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(DeviceIdMiddleware)
      .forRoutes('*') // Apply device ID middleware to all routes first
      .apply(LoggerMiddleware)
      .forRoutes('*'); // Then apply logger middleware
  }
}
