import { Module } from '@nestjs/common';
import { AuthenticationModule } from '../common/AuthModule.module';
import { TransactionModule } from '../transactions/subscription-instance.module';
import { MemberController } from './member.controller';
import { MemberService } from './member.service';
import { MemberReservationController } from './member-reservation.controller';
import { MemberReservationService } from './member-reservation.service';
import { MediaModule } from '../media/media.module';
import { TwilioModule } from 'src/twilio/twilio.module';
import { TwilioService } from 'src/twilio/twilio.service';
import { PersonalTrainersService } from 'src/personal-trainers/personal-trainers.service';
import { PTSessionEntity } from 'src/personal-trainers/entities/pt-sessions.entity';
import { SubscriptionEntity } from 'src/subscription/entities/subscription.entity';
import { GymEntity } from 'src/gym/entities/gym.entity';
import { MemberEntity } from './entities/member.entity';
import { MemberAttendingDaysEntity } from './entities/member-attending-days.entity';
import { MemberReservationEntity } from './entities/member-reservation.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
@Module({
  imports: [
    AuthenticationModule,
    TypeOrmModule.forFeature([
      MemberEntity,
      MemberAttendingDaysEntity,
      MemberReservationEntity,
      GymEntity,
      SubscriptionEntity,
      PTSessionEntity,
    ]),
    TransactionModule,
    MediaModule,
  ],
  controllers: [MemberController, MemberReservationController],
  providers: [
    MemberService,
    MemberReservationService,
    TwilioService,
    PersonalTrainersService,
  ],
  exports: [MemberService, TwilioService, TypeOrmModule],
})
export class MemberModule {}
