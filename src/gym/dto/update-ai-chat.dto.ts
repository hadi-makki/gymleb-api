import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class UpdateAiChatDto {
  @ApiProperty({
    description: 'AI chat feature status for the gym',
    example: true,
  })
  @IsBoolean()
  isAiChatEnabled: boolean;
}
