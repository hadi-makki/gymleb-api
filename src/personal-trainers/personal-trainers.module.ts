import { Module } from '@nestjs/common';
import { AuthenticationModule } from '../common/AuthModule.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ManagerEntity } from 'src/manager/manager.entity';
import { TransactionModule } from 'src/transactions/subscription-instance.module';
import { PTSessionEntity } from './entities/pt-sessions.entity';
import { PersonalTrainersController } from './personal-trainers.controller';
import { PersonalTrainersService } from './personal-trainers.service';

@Module({
  imports: [
    AuthenticationModule,

    TypeOrmModule.forFeature([PTSessionEntity, ManagerEntity]),
    TransactionModule,
  ],
  controllers: [PersonalTrainersController],
  providers: [PersonalTrainersService],
  exports: [PersonalTrainersService, TypeOrmModule],
})
export class PersonalTrainersModule {}
