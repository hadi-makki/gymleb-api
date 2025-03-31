import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ManagerModule } from 'src/manager/manager.module';
import {
  PersonalTrainer,
  PersonalTrainerSchema,
} from './entities/personal-trainer.entity';
import { PersonalTrainersController } from './personal-trainers.controller';
import { PersonalTrainersService } from './personal-trainers.service';

@Module({
  imports: [
    ManagerModule,
    MongooseModule.forFeature([
      { name: PersonalTrainer.name, schema: PersonalTrainerSchema },
    ]),
  ],
  controllers: [PersonalTrainersController],
  providers: [PersonalTrainersService],
})
export class PersonalTrainersModule {}
