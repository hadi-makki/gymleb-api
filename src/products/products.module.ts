import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MediaEntity } from 'src/media/media.entity';
import { UserEntity } from 'src/user/user.entity';
import { AuthenticationModule } from '../common/AuthModule.module';
import { MediaService } from '../media/media.service';
import { S3Service } from '../s3/s3.service';
import { UserService } from '../user/user.service';
import { ProductsController } from './products.controller';
import { ProductEntity } from './products.entity';
import { SubscriptionPlanSeeding } from './products.seed';
import { ProductsService } from './products.service';
import { TransactionModule } from 'src/transactions/transaction.module';
import { ProductsOffersEntity } from './products-offers.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ProductEntity,
      UserEntity,
      MediaEntity,
      ProductsOffersEntity,
    ]),
    AuthenticationModule,
    TransactionModule,
  ],
  providers: [
    ProductsService,
    SubscriptionPlanSeeding,
    MediaService,
    S3Service,
    UserService,
    ConfigService,
  ],
  controllers: [ProductsController],
})
export class ProductsModule {}
