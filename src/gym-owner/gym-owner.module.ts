import { Module } from '@nestjs/common';
import { GymOwnerService } from './gym-owner.service';
import { GymOwnerController } from './gym-owner.controller';

@Module({
  controllers: [GymOwnerController],
  providers: [GymOwnerService],
})
export class GymOwnerModule {}
