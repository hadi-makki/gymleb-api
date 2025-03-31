import { ApiProperty } from '@nestjs/swagger';

export class RefreshTokenOutDto {
  @ApiProperty()
  accessToken: string;
  @ApiProperty()
  refreshToken: string;
}
