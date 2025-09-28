import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class UpdateManualMessagesDto {
  @ApiProperty({
    description: 'Whether to allow manual messages for this gym',
    example: true,
  })
  @IsBoolean()
  allowManualMessages: boolean;
}
