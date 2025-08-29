import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Revenue, RevenueSchema } from './revenue.model';
import { RevenueController } from './revenue.controller';
import { RevenueService } from './revenue.service';
import { Gym, GymSchema } from '../gym/entities/gym.model';
import { AuthenticationModule } from '../common/AuthModule.module';
import { Product, ProductSchema } from '../products/products.model';
import {
  Transaction,
  TransactionSchema,
} from '../transactions/transaction.model';
import { TransactionModule } from '../transactions/subscription-instance.module';
import { TransactionEntity } from 'src/transactions/transaction.entity';
import { ProductEntity } from 'src/products/products.entity';
import { GymEntity } from 'src/gym/entities/gym.entity';
import { RevenueEntity } from './revenue.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    AuthenticationModule,
    MongooseModule.forFeature([
      { name: Revenue.name, schema: RevenueSchema },
      { name: Gym.name, schema: GymSchema },
      { name: Product.name, schema: ProductSchema },
      { name: Transaction.name, schema: TransactionSchema },
    ]),
    TypeOrmModule.forFeature([
      RevenueEntity,
      GymEntity,
      ProductEntity,
      TransactionEntity,
    ]),
    TransactionModule,
  ],
  controllers: [RevenueController],
  providers: [RevenueService],
  exports: [RevenueService],
})
export class RevenueModule {}
