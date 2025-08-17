import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '../user/user.entity';
import { Media, MediaSchema } from '../media/media.entity';
import { ProductsController } from './products.controller';
import { Product, ProductSchema } from './products.entity';
import { SubscriptionPlanSeeding } from './products.seed';
import { ProductsService } from './products.service';
import { MediaService } from '../media/media.service';
import { S3Service } from '../s3/s3.service';
import { UserService } from '../user/user.service';
import { ConfigService } from '@nestjs/config';
import { AuthenticationModule } from '../common/AuthModule.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Product.name, schema: ProductSchema },
      { name: User.name, schema: UserSchema },
      { name: Media.name, schema: MediaSchema },
    ]),
    AuthenticationModule,
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
