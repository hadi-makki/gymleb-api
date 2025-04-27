import { ApiProperty } from '@nestjs/swagger';
import { MainDto } from '../../../main-classes/main-dto';

export class UserCreatedDto extends MainDto {
  @ApiProperty()
  name: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  token: string;
}
