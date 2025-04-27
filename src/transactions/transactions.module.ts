import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TransactionsService } from './transactions.service';
import { Transaction, TransactionSchema } from './transaction.entity';
import { User, UserSchema } from '../user/user.entity';
import { Product, ProductSchema } from '../products/products.entity';
import { SubscriptionSchema } from '../subscription/entities/subscription.entity';
import { MemberSchema } from '../member/entities/member.entity';
import { GymSchema } from '../gym/entities/gym.entity';
import { Member } from '../member/entities/member.entity';
import { Gym } from '../gym/entities/gym.entity';
import { Subscription } from '../subscription/entities/subscription.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Transaction.name, schema: TransactionSchema },
      { name: User.name, schema: UserSchema },
      { name: Product.name, schema: ProductSchema },
      { name: Member.name, schema: MemberSchema },
      { name: Gym.name, schema: GymSchema },
      { name: Subscription.name, schema: SubscriptionSchema },
    ]),
  ],
  providers: [TransactionsService],
  exports: [TransactionsService],
})
export class TransactionsModule {}
