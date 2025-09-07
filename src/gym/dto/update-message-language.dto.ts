import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { MessageLanguage } from '../entities/gym.entity';

export class UpdateMessageLanguageDto {
  @ApiProperty({
    description: 'Message language for the gym',
    enum: MessageLanguage,
    example: MessageLanguage.ENGLISH,
  })
  @IsEnum(MessageLanguage)
  messagesLanguage: MessageLanguage;
}
