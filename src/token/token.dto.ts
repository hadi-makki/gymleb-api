import { IsDate, IsString } from 'class-validator';

export class GenerateTokenDTO {
  @IsString()
  userId: string;

  @IsString()
  managerId: string;

  @IsString()
  accessToken: string;

  @IsString()
  refreshToken: string;

  @IsDate()
  refreshExpirationDate: Date;

  @IsDate()
  accessExpirationDate: Date;

  @IsString()
  deviceId: string;
}
