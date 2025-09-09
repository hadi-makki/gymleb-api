import { forwardRef, Module } from '@nestjs/common';
import { TwilioService } from './twilio.service';
import { TwilioController } from './twilio.controller';
import { ConfigModule } from '@nestjs/config';
import { MemberModule } from '../member/member.module';
import { GymModule } from '../gym/gym.module';
import { AuthenticationModule } from '../common/AuthModule.module';
import { TwilioMessageEntity } from './entities/twilio-message.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GymEntity } from 'src/gym/entities/gym.entity';
import { SeedMessagesService } from './seed-messages.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([TwilioMessageEntity, GymEntity]),
    ConfigModule,
    forwardRef(() => MemberModule),
    GymModule,
    AuthenticationModule,
  ],
  controllers: [TwilioController],
  providers: [SeedMessagesService, TwilioService],
  exports: [TwilioService, TypeOrmModule],
})
export class TwilioModule {}
