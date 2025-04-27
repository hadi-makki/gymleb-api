import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthenticationModule } from '../common/AuthModule.module';
import {
  PersonalTrainer,
  PersonalTrainerSchema,
} from './entities/personal-trainer.entity';
import { PersonalTrainersController } from './personal-trainers.controller';
import { PersonalTrainersService } from './personal-trainers.service';

@Module({
  imports: [
    AuthenticationModule,
    MongooseModule.forFeature([
      { name: PersonalTrainer.name, schema: PersonalTrainerSchema },
    ]),
  ],
  controllers: [PersonalTrainersController],
  providers: [PersonalTrainersService],
})
export class PersonalTrainersModule {}
