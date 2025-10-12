import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class UpdateAllowDuplicateMemberPhonesDto {
  @ApiProperty({
    description: 'Allow duplicate member phone numbers in this gym',
  })
  @IsBoolean()
  allowDuplicateMemberPhoneNumbers: boolean;
}
