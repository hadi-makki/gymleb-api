import { Module } from '@nestjs/common';
import { StripeController } from './stripe.controller';
import { StripeService } from './stripe.service';
import { User, UserSchema } from '../user/user.entity';

import { TransactionService } from '../transactions/subscription-instance.service';
import { ConfigService } from '@nestjs/config';
import { Manager, ManagerSchema } from '../manager/manager.model';
import { TokenService } from '../token/token.service';
import Token, { TokenSchema } from '../token/token.model';
import { JwtService } from '@nestjs/jwt';
import { Product, ProductSchema } from '../products/products.entity';
import { ProductsService } from '../products/products.service';
import { MongooseModule } from '@nestjs/mongoose';
import {
  Transaction,
  TransactionSchema,
} from '../transactions/transaction.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Transaction.name, schema: TransactionSchema },
      { name: Manager.name, schema: ManagerSchema },
      { name: Token.name, schema: TokenSchema },
      { name: Product.name, schema: ProductSchema },
    ]),
  ],
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
