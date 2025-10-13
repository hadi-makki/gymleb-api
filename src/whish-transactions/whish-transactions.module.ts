import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WhishTransaction } from './entities/whish-transaction.entity';
import { WhishTransactionsController } from './whish-transactions.controller';
import { WhishTransactionsService } from './whish-transactions.service';
import { OwnerSubscriptionsModule } from '../owner-subscriptions/owner-subscriptions.module';
import { OwnerSubscriptionTypeEntity } from '../owner-subscriptions/owner-subscription-type.entity';
import { GymModule } from '../gym/gym.module';
import { GymEntity } from 'src/gym/entities/gym.entity';
import { AuthenticationModule } from 'src/common/AuthModule.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      WhishTransaction,
      OwnerSubscriptionTypeEntity,
      GymEntity,
    ]),
    ConfigModule, // to access env
    forwardRef(() => OwnerSubscriptionsModule),
    forwardRef(() => GymModule),
    AuthenticationModule,
  ],
  controllers: [WhishTransactionsController],
  providers: [WhishTransactionsService],
})
export class WhishTransactionsModule {}
