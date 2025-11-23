import { Module } from '@nestjs/common';
import { AuthenticationModule } from '../common/AuthModule.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ManagerEntity } from 'src/manager/manager.entity';
import { MediaModule } from 'src/media/media.module';
import { TransactionModule } from 'src/transactions/transaction.module';
import { PTSessionEntity } from './entities/pt-sessions.entity';
import { PersonalTrainersController } from './personal-trainers.controller';
import { PersonalTrainersService } from './personal-trainers.service';
import { PtSessionsSeed } from './pt-sessions.seed';
import { PersonalTrainersMigrationSeed } from './seed/personal-trainers-migration.seed';

@Module({
  imports: [
    AuthenticationModule,
    MediaModule,
    TypeOrmModule.forFeature([PTSessionEntity, ManagerEntity]),
    TransactionModule,
  ],
  controllers: [PersonalTrainersController],
  providers: [
    PersonalTrainersService,
    PtSessionsSeed,
    PersonalTrainersMigrationSeed,
  ],
  exports: [PersonalTrainersService, TypeOrmModule],
})
export class PersonalTrainersModule {}
