import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
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
import { SubscriptionInstanceModule } from './transactions/subscription-instance.module';
import { UserModule } from './user/user.module';
import { MongooseModule } from '@nestjs/mongoose';
import { Manager, ManagerSchema } from './manager/manager.entity';
import { PersonalTrainersModule } from './personal-trainers/personal-trainers.module';
import { SubscriptionModule } from './subscription/subscription.module';
import { GymModule } from './gym/gym.module';
import { MemberModule } from './member/member.module';
import { GymSeeding } from './seeder/gym.seeding';
import { Gym, GymSchema } from './gym/entities/gym.entity';
import { TwilioModule } from './twilio/twilio.module';
import { ExpensesModule } from './expenses/expenses.module';
import { RevenueModule } from './revenue/revenue.module';
import { OwnerSubscriptionsModule } from './owner-subscriptions/owner-subscriptions.module';
import { GymOwnerModule } from './gym-owner/gym-owner.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Manager.name, schema: ManagerSchema },
      { name: Gym.name, schema: GymSchema },
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
    SubscriptionInstanceModule,
    PersonalTrainersModule,
    SubscriptionModule,
    GymModule,
    MemberModule,
    TwilioModule,
    ExpensesModule,
    RevenueModule,
    OwnerSubscriptionsModule,
    GymOwnerModule,
  ],
  controllers: [AppController],
  providers: [AppService, ManagerSeeding, GymSeeding],
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
