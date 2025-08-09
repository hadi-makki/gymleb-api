import { Module } from '@nestjs/common';
import { StripeController } from './stripe.controller';
import { StripeService } from './stripe.service';
import { User, UserSchema } from '../user/user.entity';
import {
  SubscriptionInstance,
  SubscriptionInstanceSchema,
} from '../transactions/subscription-instance.entity';
import { SubscriptionInstanceService } from '../transactions/subscription-instance.service';
import { ConfigService } from '@nestjs/config';
import { Manager, ManagerSchema } from '../manager/manager.entity';
import { TokenService } from '../token/token.service';
import Token, { TokenSchema } from '../token/token.entity';
import { JwtService } from '@nestjs/jwt';
import { Product, ProductSchema } from '../products/products.entity';
import { ProductsService } from '../products/products.service';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: SubscriptionInstance.name, schema: SubscriptionInstanceSchema },
      { name: Manager.name, schema: ManagerSchema },
      { name: Token.name, schema: TokenSchema },
      { name: Product.name, schema: ProductSchema },
    ]),
  ],
  providers: [
    StripeService,
    SubscriptionInstanceService,
    ConfigService,
    TokenService,
    JwtService,
    ProductsService,
  ],
  controllers: [StripeController],
})
export class StripeModule {}
