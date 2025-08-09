import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SubscriptionInstanceService } from './subscription-instance.service';
import {
  SubscriptionInstance,
  SubscriptionInstanceSchema,
} from './subscription-instance.entity';
import { User, UserSchema } from '../user/user.entity';
import { Product, ProductSchema } from '../products/products.entity';
import { SubscriptionSchema } from '../subscription/entities/subscription.entity';
import { MemberSchema } from '../member/entities/member.entity';
import { GymSchema } from '../gym/entities/gym.entity';
import { Member } from '../member/entities/member.entity';
import { Gym } from '../gym/entities/gym.entity';
import { Subscription } from '../subscription/entities/subscription.entity';
import { Manager, ManagerSchema } from '../manager/manager.entity';
import {
  OwnerSubscriptionType,
  OwnerSubscriptionTypeSchema,
} from '../owner-subscriptions/owner-subscription-type.entity';
import {
  OwnerSubscription,
  OwnerSubscriptionSchema,
} from 'src/owner-subscriptions/owner-subscription.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: SubscriptionInstance.name, schema: SubscriptionInstanceSchema },
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
    ]),
  ],
  providers: [SubscriptionInstanceService],
  exports: [SubscriptionInstanceService, MongooseModule],
})
export class SubscriptionInstanceModule {}
