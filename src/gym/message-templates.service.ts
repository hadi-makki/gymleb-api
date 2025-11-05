import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  MessageTemplateEntity,
  MessageTemplateType,
} from './entities/message-template.entity';

@Injectable()
export class MessageTemplatesService {
  constructor(
    @InjectRepository(MessageTemplateEntity)
    private readonly templatesRepo: Repository<MessageTemplateEntity>,
  ) {}

  async listByGym(gymId: string): Promise<MessageTemplateEntity[]> {
    return this.templatesRepo.find({ where: { gymId } });
  }

  async upsert(
    gymId: string,
    type: MessageTemplateType,
    content: string,
  ): Promise<MessageTemplateEntity> {
    const existing = await this.templatesRepo.findOne({
      where: { gym: { id: gymId }, type },
    });
    if (existing) {
      existing.content = content;
      return await this.templatesRepo.save(existing);
    }
    const created = this.templatesRepo.create({ gymId, type, content });
    return await this.templatesRepo.save(created);
  }
}
