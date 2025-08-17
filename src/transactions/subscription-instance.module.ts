import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TransactionController } from './subscription-instance.controller';
import { TransactionService } from './subscription-instance.service';

import { AuthenticationModule } from '../common/AuthModule.module';
import {
  OwnerSubscription,
  OwnerSubscriptionSchema,
} from '../owner-subscriptions/owner-subscription.entity';
import { Gym, GymSchema } from '../gym/entities/gym.entity';
import { Manager, ManagerSchema } from '../manager/manager.entity';
import { Member, MemberSchema } from '../member/entities/member.entity';
import {
  OwnerSubscriptionType,
  OwnerSubscriptionTypeSchema,
} from '../owner-subscriptions/owner-subscription-type.entity';
import { Product, ProductSchema } from '../products/products.entity';
import {
  Subscription,
  SubscriptionSchema,
} from '../subscription/entities/subscription.entity';
import { User, UserSchema } from '../user/user.entity';
import {
  SubscriptionInstance,
  SubscriptionInstanceSchema,
} from './subscription-instance.entity';
import { Transaction, TransactionSchema } from './transaction.entity';
import { TransactionSeeding } from './transactions.seed';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Transaction.name, schema: TransactionSchema },
      { name: User.name, schema: UserSchema },
      { name: Product.name, schema: ProductSchema },
      { name: Member.name, schema: MemberSchema },
      { name: Gym.name, schema: GymSchema },
      { name: Subscription.name, schema: SubscriptionSchema },
      { name: Manager.name, schema: ManagerSchema },
      {
        name: OwnerSubscriptionType.name,
        schema: OwnerSubscriptionTypeSchema,
      },
      {
        name: OwnerSubscription.name,
        schema: OwnerSubscriptionSchema,
      },
      { name: Transaction.name, schema: TransactionSchema },
      { name: SubscriptionInstance.name, schema: SubscriptionInstanceSchema },
    ]),
    AuthenticationModule,
  ],
  providers: [TransactionService, TransactionSeeding],
  controllers: [TransactionController],
  exports: [TransactionService, MongooseModule],
})
export class TransactionModule {}
