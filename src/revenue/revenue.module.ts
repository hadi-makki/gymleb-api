import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Revenue, RevenueSchema } from './revenue.entity';
import { RevenueController } from './revenue.controller';
import { RevenueService } from './revenue.service';
import { Gym, GymSchema } from '../gym/entities/gym.entity';
import { AuthenticationModule } from '../common/AuthModule.module';
import { Product, ProductSchema } from 'src/products/products.entity';
import {
  Transaction,
  TransactionSchema,
} from 'src/transactions/transaction.entity';
import { TransactionModule } from 'src/transactions/subscription-instance.module';

@Module({
  imports: [
    AuthenticationModule,
    MongooseModule.forFeature([
      { name: Revenue.name, schema: RevenueSchema },
      { name: Gym.name, schema: GymSchema },
      { name: Product.name, schema: ProductSchema },
      { name: Transaction.name, schema: TransactionSchema },
    ]),
    TransactionModule,
  ],
  controllers: [RevenueController],
  providers: [RevenueService],
  exports: [RevenueService],
})
export class RevenueModule {}
