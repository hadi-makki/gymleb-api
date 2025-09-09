import { Injectable, OnModuleInit } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import {
  TwilioMessageEntity,
  TwilioMessageType,
} from './entities/twilio-message.entity';
import { GymEntity } from 'src/gym/entities/gym.entity';

@Injectable()
export class SeedMessagesService implements OnModuleInit {
  constructor(
    @InjectRepository(TwilioMessageEntity)
    private readonly twilioMessageRepository: Repository<TwilioMessageEntity>,
    @InjectRepository(GymEntity)
    private readonly gymRepository: Repository<GymEntity>,
  ) {}

  async onModuleInit() {
    // Implementation for the onModuleInit method
    // console.log('Module has been initialized.');
    // await this.seedWelcomeMessages();
  }

  async seedWelcomeMessages() {
    const gyms = await this.gymRepository.find();
    for (const gym of gyms) {
      const welcomeMessagesArray = Array.from(
        { length: gym.welcomeMessageNotified },
        (_, i) => i + 1,
      );
      const expiryMessagesArray = Array.from(
        { length: gym.membersNotified },
        (_, i) => i + 1,
      );
      for (const welcomeMessage of welcomeMessagesArray) {
        const twilioMessage = this.twilioMessageRepository.create({
          gym,
          message: 'Welcome to our gym',
          messageType: TwilioMessageType.welcomeMessage,
        });
        await this.twilioMessageRepository.save(twilioMessage);
      }
      for (const expiryMessage of expiryMessagesArray) {
        const twilioMessage = this.twilioMessageRepository.create({
          gym,
          message: 'Your membership has expired',
          messageType: TwilioMessageType.expiaryReminder,
        });
        await this.twilioMessageRepository.save(twilioMessage);
      }
    }
  }
}
