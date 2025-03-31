import { ApiProperty } from '@nestjs/swagger';
import { MainDto } from '../../../main-classes/main-dto';

export class LoginOutDto extends MainDto {
  @ApiProperty()
  token: string;
}
