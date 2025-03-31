import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

// src/auth/dto/refresh.dto.ts
export class RefreshDto {
  @ApiProperty()
  @IsString()
  deviceId: string;
}
