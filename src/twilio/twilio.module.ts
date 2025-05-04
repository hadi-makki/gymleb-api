import { Module } from '@nestjs/common';
import { TwilioService } from './twilio.service';
import { TwilioController } from './twilio.controller';
import { ConfigModule } from '@nestjs/config';
import { MemberModule } from 'src/member/member.module';
import { GymModule } from 'src/gym/gym.module';
import { AuthenticationModule } from 'src/common/AuthModule.module';

@Module({
  imports: [ConfigModule, MemberModule, GymModule, AuthenticationModule],
  controllers: [TwilioController],
  providers: [TwilioService],
})
export class TwilioModule {}
