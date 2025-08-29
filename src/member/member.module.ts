import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthenticationModule } from '../common/AuthModule.module';
import { Gym, GymSchema } from '../gym/entities/gym.model';
import {
  Subscription,
  SubscriptionSchema,
} from '../subscription/entities/subscription.model';
import { TransactionModule } from '../transactions/subscription-instance.module';
import { Member, MemberSchema } from './entities/member.model';
import { MemberController } from './member.controller';
import { MemberService } from './member.service';
import { MediaModule } from '../media/media.module';
import { TwilioModule } from 'src/twilio/twilio.module';
import { TwilioService } from 'src/twilio/twilio.service';
import { PersonalTrainersService } from 'src/personal-trainers/personal-trainers.service';
import {
  PTSession,
  PTSessionSchema,
} from 'src/personal-trainers/entities/pt-sessions.model';
import { PTSessionEntity } from 'src/personal-trainers/entities/pt-sessions.entity';
import { SubscriptionEntity } from 'src/subscription/entities/subscription.entity';
import { GymEntity } from 'src/gym/entities/gym.entity';
import { MemberEntity } from './entities/member.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
@Module({
  imports: [
    AuthenticationModule,
    MongooseModule.forFeature([
      { name: Member.name, schema: MemberSchema },
      { name: Gym.name, schema: GymSchema },
      { name: Subscription.name, schema: SubscriptionSchema },
      { name: PTSession.name, schema: PTSessionSchema },
    ]),
    TypeOrmModule.forFeature([
      MemberEntity,
      GymEntity,
      SubscriptionEntity,
      PTSessionEntity,
    ]),
    TransactionModule,
    MediaModule,
  ],
  controllers: [MemberController],
  providers: [MemberService, TwilioService, PersonalTrainersService],
  exports: [MemberService, TwilioService, MongooseModule],
})
export class MemberModule {}
