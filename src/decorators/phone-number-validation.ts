import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { CustomPhoneValidator } from 'src/utils/validations';

export class PhoneNumberValidation {
  @ApiProperty()
  @CustomPhoneValidator()
  @IsNotEmpty()
  @IsString()
  phoneNumber: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  phoneNumberISOCode: string;
}
