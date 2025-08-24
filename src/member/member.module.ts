import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthenticationModule } from '../common/AuthModule.module';
import { Gym, GymSchema } from '../gym/entities/gym.entity';
import {
  Subscription,
  SubscriptionSchema,
} from '../subscription/entities/subscription.entity';
import { TransactionModule } from '../transactions/subscription-instance.module';
import { Member, MemberSchema } from './entities/member.entity';
import { MemberController } from './member.controller';
import { MemberService } from './member.service';
import { MediaModule } from '../media/media.module';
import { TwilioModule } from 'src/twilio/twilio.module';
import { TwilioService } from 'src/twilio/twilio.service';
@Module({
  imports: [
    AuthenticationModule,
    MongooseModule.forFeature([
      { name: Member.name, schema: MemberSchema },
      { name: Gym.name, schema: GymSchema },
      { name: Subscription.name, schema: SubscriptionSchema },
    ]),
    TransactionModule,
    MediaModule,
  ],
  controllers: [MemberController],
  providers: [MemberService, TwilioService],
  exports: [MemberService, TwilioService],
})
export class MemberModule {}
