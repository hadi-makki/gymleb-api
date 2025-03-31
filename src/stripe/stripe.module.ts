import { Module } from '@nestjs/common';
import { StripeController } from './stripe.controller';
import { StripeService } from './stripe.service';
import { User, UserSchema } from 'src/user/user.entity';
import {
  Transaction,
  TransactionSchema,
} from 'src/transactions/transaction.entity';
import { TransactionsService } from 'src/transactions/transactions.service';
import { ConfigService } from '@nestjs/config';
import { Manager, ManagerSchema } from 'src/manager/manager.entity';
import { TokenService } from 'src/token/token.service';
import Token, { TokenSchema } from 'src/token/token.entity';
import { JwtService } from '@nestjs/jwt';
import { Product, ProductSchema } from 'src/products/products.entity';
import { ProductsService } from 'src/products/products.service';
import { MongooseModule } from '@nestjs/mongoose';

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
    TransactionsService,
    ConfigService,
    TokenService,
    JwtService,
    ProductsService,
  ],
  controllers: [StripeController],
})
export class StripeModule {}
