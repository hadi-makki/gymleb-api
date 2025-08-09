import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthenticationModule } from '../common/AuthModule.module';
import { Gym, GymSchema } from '../gym/entities/gym.entity';
import {
  Subscription,
  SubscriptionSchema,
} from '../subscription/entities/subscription.entity';
import { SubscriptionInstanceModule } from '../transactions/subscription-instance.module';
import { Member, MemberSchema } from './entities/member.entity';
import { MemberController } from './member.controller';
import { MemberService } from './member.service';
@Module({
  imports: [
    AuthenticationModule,
    MongooseModule.forFeature([
      { name: Member.name, schema: MemberSchema },
      { name: Gym.name, schema: GymSchema },
      { name: Subscription.name, schema: SubscriptionSchema },
    ]),
    SubscriptionInstanceModule,
  ],
  controllers: [MemberController],
  providers: [MemberService],
  exports: [MemberService],
})
export class MemberModule {}
