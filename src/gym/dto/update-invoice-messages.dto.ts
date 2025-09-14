import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class UpdateInvoiceMessagesDto {
  @ApiProperty({
    description: 'Whether the gym should send invoice messages',
    example: true,
  })
  @IsBoolean()
  sendInvoiceMessages: boolean;
}
