import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { CustomPhoneValidator } from 'src/utils/validations';

export class UpdateGymPhoneDto {
  @ApiProperty({
    description: 'Phone number',
    example: '+96179341209',
  })
  @CustomPhoneValidator()
  @IsNotEmpty()
  @IsString()
  phoneNumber: string;

  @ApiProperty({
    description: 'Phone number ISO country code',
    example: 'LB',
  })
  @IsNotEmpty()
  @IsString()
  phoneNumberISOCode: string;
}
