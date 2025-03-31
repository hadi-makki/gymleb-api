import { IsString } from 'class-validator';

export class JWTConfig {
  @IsString()
  JWT_ACCESS_SECRET: string;
  @IsString()
  JWT_REFRESH_SECRET: string;
  @IsString()
  JWT_ACCESS_EXPIRATION_IN_MINUTES: string;
  @IsString()
  JWT_REFRESH_EXPIRATION_DAYS: string;
}
