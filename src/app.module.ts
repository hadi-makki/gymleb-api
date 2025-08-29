import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { DatabaseModule } from './database/database.module';
import { loggerMiddleware } from './logger/logger.service';
import { DeviceIdMiddleware } from './middleware/device-id.middleware';
import { ManagerModule } from './manager/manager.module';
import { MediaModule } from './media/media.module';
import { S3Module } from './s3/s3.module';
import { ManagerSeeding } from './seeder/managers.seeding';
import { TokenModule } from './token/token.module';
import { TransactionModule } from './transactions/subscription-instance.module';
import { UserModule } from './user/user.module';
import { MongooseModule } from '@nestjs/mongoose';
import { Manager, ManagerSchema } from './manager/manager.model';
import { PersonalTrainersModule } from './personal-trainers/personal-trainers.module';
import { SubscriptionModule } from './subscription/subscription.module';
import { GymModule } from './gym/gym.module';
import { MemberModule } from './member/member.module';
import { GymSeeding } from './seeder/gym.seeding';
import { Gym, GymSchema } from './gym/entities/gym.model';
import { TwilioModule } from './twilio/twilio.module';
import { ExpensesModule } from './expenses/expenses.module';
import { RevenueModule } from './revenue/revenue.module';
import { OwnerSubscriptionsModule } from './owner-subscriptions/owner-subscriptions.module';
import { GymOwnerModule } from './gym-owner/gym-owner.module';
import { ProductsModule } from './products/products.module';
import { StaffModule } from './staff/staff.module';
import { CronModule } from './cron/cron.module';
import { DatabaseMigration } from './database.migration';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ManagerEntity } from './manager/manager.entity';
import { GymEntity } from './gym/entities/gym.entity';
import { OwnerSubscriptionTypeEntity } from './owner-subscriptions/owner-subscription-type.entity';
import { OwnerSubscriptionEntity } from './owner-subscriptions/owner-subscription.entity';
import { TokenEntity } from './token/token.entity';
import { MemberEntity } from './member/entities/member.entity';
import { MediaEntity } from './media/media.entity';
import { ExpenseEntity } from './expenses/expense.entity';
import { RevenueEntity } from './revenue/revenue.entity';
import { ProductEntity } from './products/products.entity';
import { SubscriptionEntity } from './subscription/entities/subscription.entity';
import { SubscriptionInstanceEntity } from './transactions/subscription-instance.entity';
import { TransactionEntity } from './transactions/transaction.entity';
import { PTSessionEntity } from './personal-trainers/entities/pt-sessions.entity';

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // Time window in milliseconds (1 minute)
        limit: 100, // Maximum number of requests per ttl window
      },
    ]),
    MongooseModule.forFeature([
      { name: Manager.name, schema: ManagerSchema },
      { name: Gym.name, schema: GymSchema },
    ]),
    TypeOrmModule.forFeature([
      ManagerEntity,
      GymEntity,
      OwnerSubscriptionTypeEntity,
      OwnerSubscriptionEntity,
      TokenEntity,
      MemberEntity,
      MediaEntity,
      ExpenseEntity,
      RevenueEntity,
      ProductEntity,
      SubscriptionEntity,
      SubscriptionInstanceEntity,
      TransactionEntity,
      PTSessionEntity,
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
      .apply(loggerMiddleware)
      .forRoutes('*'); // Then apply logger middleware
  }
}
