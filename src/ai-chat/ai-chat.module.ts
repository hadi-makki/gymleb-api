import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AiChatEntity } from './entities/ai-chat.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiChatController } from './ai-chat.controller';
import { AiChatService } from './ai-chat.service';
import { AuthenticationModule } from 'src/common/AuthModule.module';
import { MemberModule } from 'src/member/member.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([AiChatEntity]),
    ConfigModule,
    AuthenticationModule,
    MemberModule,
  ],
  controllers: [AiChatController],
  providers: [AiChatService],
  exports: [AiChatService],
})
export class AiChatModule {}
