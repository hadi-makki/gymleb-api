import { IsNotEmpty, IsUUID, IsOptional, IsDateString } from 'class-validator';

export class GenerateLicenseDto {
  @IsNotEmpty()
  @IsUUID()
  gymId: string;

  @IsNotEmpty()
  @IsUUID()
  ownerId: string;

  @IsOptional()
  @IsDateString()
  expiresAt?: string; // ISO 8601 date string
}
