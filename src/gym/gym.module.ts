import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthenticationModule } from '../common/AuthModule.module';
import { GymController } from './gym.controller';
import { GymService } from './gym.service';
import { GymPresetController } from './gym-preset.controller';
import { GymPresetService } from './gym-preset.service';
import { GymEntity } from './entities/gym.entity';
import { GymPresetEntity } from './entities/gym-preset.entity';

@Module({
  imports: [
    AuthenticationModule,
    TypeOrmModule.forFeature([GymEntity, GymPresetEntity]),
  ],
  controllers: [GymController, GymPresetController],
  providers: [GymService, GymPresetService],
  exports: [GymService, GymPresetService],
})
export class GymModule {}
