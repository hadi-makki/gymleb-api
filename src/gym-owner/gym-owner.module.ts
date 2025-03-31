import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthenticationModule } from 'src/common/AuthModule.module';
import { GymOwner, GymOwnerSchema } from './entities/gym-owner.entity';
import { GymOwnerController } from './gym-owner.controller';
import { GymOwnerService } from './gym-owner.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: GymOwner.name, schema: GymOwnerSchema },
    ]),
    AuthenticationModule,
  ],
  controllers: [GymOwnerController],
  providers: [GymOwnerService],
})
export class GymOwnerModule {}
