import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GymEntity } from 'src/gym/entities/gym.entity';
import { NotificationSettingEntity } from 'src/notification-settings/entities/notification-setting.entity';
import { PTSessionEntity } from 'src/personal-trainers/entities/pt-sessions.entity';
import { PersonalTrainersService } from 'src/personal-trainers/personal-trainers.service';
import { SubscriptionEntity } from 'src/subscription/entities/subscription.entity';
import { TwilioMessageEntity } from 'src/twilio/entities/twilio-message.entity';
import { TwilioService } from 'src/twilio/twilio.service';
import { UserEntity } from 'src/user/user.entity';
import { AuthenticationModule } from '../common/AuthModule.module';
import { MediaModule } from '../media/media.module';
import { TransactionModule } from '../transactions/transaction.module';
import { MemberAttendingDaysEntity } from './entities/member-attending-days.entity';
import { MemberTrainingProgramEntity } from './entities/member-training-program.entity';
import { MemberEntity } from './entities/member.entity';
import { MemberTrainingProgramController } from './member-training-program.controller';
import { MemberTrainingProgramService } from './member-training-program.service';
import { MemberController } from './member.controller';
import { MemberService } from './member.service';
import { MemberNotSettingsSeed } from './seed/member-not-settings.seed';
import { MemberTrainingProgramSeed } from './seed/member-training-program.seed';
@Module({
  imports: [
    AuthenticationModule,
    TypeOrmModule.forFeature([
      MemberEntity,
      MemberAttendingDaysEntity,
      MemberTrainingProgramEntity,
      GymEntity,
      SubscriptionEntity,
      PTSessionEntity,
      TwilioMessageEntity,
      NotificationSettingEntity,
      UserEntity,
    ]),
    TransactionModule,
    MediaModule,
  ],
  controllers: [MemberController, MemberTrainingProgramController],
  providers: [
    MemberService,
    MemberTrainingProgramService,
    TwilioService,
    PersonalTrainersService,
    MemberNotSettingsSeed,
    MemberTrainingProgramSeed,
  ],
  exports: [MemberService, TwilioService, TypeOrmModule],
})
export class MemberModule {}
