import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TransactionsService } from './transactions.service';
import { Transaction, TransactionSchema } from './transaction.entity';
import { User, UserSchema } from 'src/user/user.entity';
import { Product, ProductSchema } from 'src/products/products.entity';
import { SubscriptionSchema } from 'src/subscription/entities/subscription.entity';
import { MemberSchema } from 'src/member/entities/member.entity';
import { GymSchema } from 'src/gym/entities/gym.entity';
import { Member } from 'src/member/entities/member.entity';
import { Gym } from 'src/gym/entities/gym.entity';
import { Subscription } from 'src/subscription/entities/subscription.entity';

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
