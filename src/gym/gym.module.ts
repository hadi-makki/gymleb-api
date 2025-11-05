import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthenticationModule } from '../common/AuthModule.module';
import { GymController } from './gym.controller';
import { GymService } from './gym.service';
import { GymPresetController } from './gym-preset.controller';
import { GymPresetService } from './gym-preset.service';
import { GymEntity } from './entities/gym.entity';
import { GymPresetEntity } from './entities/gym-preset.entity';
import { MediaModule } from 'src/media/media.module';
import { MessageTemplateEntity } from './entities/message-template.entity';
import { MessageTemplatesService } from './message-templates.service';
import { MessageTemplatesController } from './message-templates.controller';

@Module({
  imports: [
    AuthenticationModule,
    TypeOrmModule.forFeature([
      GymEntity,
      GymPresetEntity,
      MessageTemplateEntity,
    ]),
  ],
  controllers: [GymController, GymPresetController, MessageTemplatesController],
  providers: [GymService, GymPresetService, MessageTemplatesService],
  exports: [GymService, GymPresetService, MessageTemplatesService],
})
export class GymModule {}
