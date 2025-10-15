import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class UpdateAllowUserWithoutPhoneNumberDto {
  @ApiProperty({
    description: 'Allow creating members without phone numbers in this gym',
  })
  @IsBoolean()
  allowUserWithoutPhoneNumber: boolean;
}
