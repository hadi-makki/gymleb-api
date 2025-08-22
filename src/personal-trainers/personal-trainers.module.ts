import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthenticationModule } from '../common/AuthModule.module';

import { PersonalTrainersController } from './personal-trainers.controller';
import { PersonalTrainersService } from './personal-trainers.service';
import { PTSession } from './entities/pt-sessions.entity';
import { PTSessionSchema } from './entities/pt-sessions.entity';
import { Manager, ManagerSchema } from 'src/manager/manager.entity';
import { TransactionModule } from 'src/transactions/subscription-instance.module';

@Module({
  imports: [
    AuthenticationModule,
    MongooseModule.forFeature([
      { name: Manager.name, schema: ManagerSchema },
      { name: PTSession.name, schema: PTSessionSchema },
    ]),
    TransactionModule,
  ],
  controllers: [PersonalTrainersController],
  providers: [PersonalTrainersService],
})
export class PersonalTrainersModule {}
