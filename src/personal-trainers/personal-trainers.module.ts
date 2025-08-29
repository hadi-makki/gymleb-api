import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthenticationModule } from '../common/AuthModule.module';

import { PersonalTrainersController } from './personal-trainers.controller';
import { PersonalTrainersService } from './personal-trainers.service';
import { PTSession } from './entities/pt-sessions.model';
import { PTSessionSchema } from './entities/pt-sessions.model';
import { Manager, ManagerSchema } from 'src/manager/manager.model';
import { TransactionModule } from 'src/transactions/subscription-instance.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ManagerEntity } from 'src/manager/manager.entity';
import { PTSessionEntity } from './entities/pt-sessions.entity';

@Module({
  imports: [
    AuthenticationModule,
    MongooseModule.forFeature([
      { name: Manager.name, schema: ManagerSchema },
      { name: PTSession.name, schema: PTSessionSchema },
    ]),
    TypeOrmModule.forFeature([PTSessionEntity, ManagerEntity]),
    TransactionModule,
  ],
  controllers: [PersonalTrainersController],
  providers: [PersonalTrainersService],
  exports: [PersonalTrainersService, MongooseModule],
})
export class PersonalTrainersModule {}
