import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TransactionController } from './subscription-instance.controller';
import { TransactionService } from './subscription-instance.service';

import { AuthenticationModule } from '../common/AuthModule.module';
import {
  OwnerSubscription,
  OwnerSubscriptionSchema,
} from '../owner-subscriptions/owner-subscription.model';
import { Gym, GymSchema } from '../gym/entities/gym.model';
import { Manager, ManagerSchema } from '../manager/manager.model';
import { Member, MemberSchema } from '../member/entities/member.model';
import {
  OwnerSubscriptionType,
  OwnerSubscriptionTypeSchema,
} from '../owner-subscriptions/owner-subscription-type.model';
import { Product, ProductSchema } from '../products/products.model';
import {
  Subscription,
  SubscriptionSchema,
} from '../subscription/entities/subscription.model';
import { User, UserSchema } from '../user/user.model';
import {
  SubscriptionInstance,
  SubscriptionInstanceSchema,
} from './subscription-instance.model';
import { Transaction, TransactionSchema } from './transaction.model';
import { TransactionSeeding } from './transactions.seed';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TransactionEntity } from './transaction.entity';
import { UserEntity } from 'src/user/user.entity';
import { ProductEntity } from 'src/products/products.entity';
import { MemberEntity } from 'src/member/entities/member.entity';
import { GymEntity } from 'src/gym/entities/gym.entity';
import { ManagerEntity } from 'src/manager/manager.entity';
import { OwnerSubscriptionEntity } from 'src/owner-subscriptions/owner-subscription.entity';
import { ExpenseEntity } from 'src/expenses/expense.entity';
import { SubscriptionEntity } from 'src/subscription/entities/subscription.entity';
import { OwnerSubscriptionTypeEntity } from 'src/owner-subscriptions/owner-subscription-type.entity';
import { RevenueEntity } from 'src/revenue/revenue.entity';
import { SubscriptionInstanceEntity } from './subscription-instance.entity';

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
    TypeOrmModule.forFeature([
      TransactionEntity,
      UserEntity,
      ProductEntity,
      MemberEntity,
      GymEntity,
      ManagerEntity,
      OwnerSubscriptionEntity,
      ExpenseEntity,
      SubscriptionEntity,
      OwnerSubscriptionTypeEntity,
      RevenueEntity,
      SubscriptionInstanceEntity,
    ]),
    AuthenticationModule,
  ],
  providers: [TransactionService, TransactionSeeding],
  controllers: [TransactionController],
  exports: [TransactionService, MongooseModule],
})
export class TransactionModule {}
