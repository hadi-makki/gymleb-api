import { Module } from '@nestjs/common';
import { User, UserSchema } from 'src/user/user.entity';
import { ProductsController } from './products.controller';
import { Product, ProductSchema } from './products.entity';
import { SubscriptionPlanSeeding } from './products.seed';
import { ProductsService } from './products.service';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Product.name, schema: ProductSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  providers: [ProductsService, SubscriptionPlanSeeding],
  controllers: [ProductsController],
})
export class ProductsModule {}
