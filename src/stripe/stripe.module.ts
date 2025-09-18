import { Module } from '@nestjs/common';
import { StripeController } from './stripe.controller';
import { StripeService } from './stripe.service';

import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { ProductsService } from '../products/products.service';
import { TokenService } from '../token/token.service';
import { TransactionService } from '../transactions/transaction.service';

@Module({
  imports: [],
  providers: [
    StripeService,
    TransactionService,
    ConfigService,
    TokenService,
    JwtService,
    ProductsService,
  ],
  controllers: [StripeController],
})
export class StripeModule {}
