import { IsDate, IsOptional, IsString } from 'class-validator';

export class GenerateTokenDTO {
  @IsString()
  @IsOptional()
  userId: string;

  @IsString()
  @IsOptional()
  managerId: string;

  @IsString()
  @IsOptional()
  userTokenId: string;

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
