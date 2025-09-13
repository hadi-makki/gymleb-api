import { Module } from '@nestjs/common';
import { AuthenticationModule } from '../common/AuthModule.module';
import { TransactionModule } from '../transactions/subscription-instance.module';
import { MemberController } from './member.controller';
import { MemberService } from './member.service';
import { MemberReservationController } from './member-reservation.controller';
import { MemberReservationService } from './member-reservation.service';
import { MemberTrainingProgramController } from './member-training-program.controller';
import { MemberTrainingProgramService } from './member-training-program.service';
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
import { MemberTrainingProgramEntity } from './entities/member-training-program.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TwilioMessageEntity } from 'src/twilio/entities/twilio-message.entity';
import { MemberNotSettingsSeed } from './seed/member-not-settings.seed';
import { NotificationSettingEntity } from 'src/notification-settings/entities/notification-setting.entity';
@Module({
  imports: [
    AuthenticationModule,
    TypeOrmModule.forFeature([
      MemberEntity,
      MemberAttendingDaysEntity,
      MemberReservationEntity,
      MemberTrainingProgramEntity,
      GymEntity,
      SubscriptionEntity,
      PTSessionEntity,
      TwilioMessageEntity,
      NotificationSettingEntity,
    ]),
    TransactionModule,
    MediaModule,
  ],
  controllers: [
    MemberController,
    MemberReservationController,
    MemberTrainingProgramController,
  ],
  providers: [
    MemberService,
    MemberReservationService,
    MemberTrainingProgramService,
    TwilioService,
    PersonalTrainersService,
    MemberNotSettingsSeed,
  ],
  exports: [MemberService, TwilioService, TypeOrmModule],
})
export class MemberModule {}
