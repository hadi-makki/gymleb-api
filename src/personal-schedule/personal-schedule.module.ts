import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PersonalScheduleService } from './personal-schedule.service';
import { PersonalScheduleController } from './personal-schedule.controller';
import { PersonalScheduleEntity } from './entities/personal-schedule.entity';
import { GymEntity } from '../gym/entities/gym.entity';
import { MemberEntity } from '../member/entities/member.entity';
import { ManagerEntity } from '../manager/manager.entity';
import { AuthenticationModule } from 'src/common/AuthModule.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PersonalScheduleEntity,
      GymEntity,
      MemberEntity,
      ManagerEntity,
    ]),
    AuthenticationModule,
  ],
  controllers: [PersonalScheduleController],
  providers: [PersonalScheduleService],
  exports: [PersonalScheduleService],
})
export class PersonalScheduleModule {}
