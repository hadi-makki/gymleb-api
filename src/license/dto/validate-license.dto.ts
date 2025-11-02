import { IsNotEmpty, IsString, IsOptional, IsUUID } from 'class-validator';

export class ValidateLicenseDto {
  @IsNotEmpty()
  @IsString()
  licenseKey: string;

  @IsOptional()
  @IsUUID()
  gymId?: string; // Optional - if not provided, uses gymId from token
}
