import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GymEntity } from 'src/gym/entities/gym.entity';
import { ProductEntity } from 'src/products/products.entity';
import { TransactionEntity } from 'src/transactions/transaction.entity';
import { AuthenticationModule } from '../common/AuthModule.module';
import { TransactionModule } from '../transactions/subscription-instance.module';
import { RevenueController } from './revenue.controller';
import { RevenueEntity } from './revenue.entity';
import { RevenueService } from './revenue.service';
import { ProductsOffersEntity } from 'src/products/products-offers.entity';

@Module({
  imports: [
    AuthenticationModule,

    TypeOrmModule.forFeature([
      RevenueEntity,
      GymEntity,
      ProductEntity,
      TransactionEntity,
      ProductsOffersEntity,
    ]),
    TransactionModule,
  ],
  controllers: [RevenueController],
  providers: [RevenueService],
  exports: [RevenueService],
})
export class RevenueModule {}
