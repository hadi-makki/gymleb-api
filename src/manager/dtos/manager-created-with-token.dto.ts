import { ApiProperty } from '@nestjs/swagger';
import { ManagerCreatedDto } from './manager-created.dto';

export class ManagerCreatedWithTokenDto extends ManagerCreatedDto {
  @ApiProperty()
  token: string;

  @ApiProperty()
  deviceId: string;
}
