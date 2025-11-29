import { IsBoolean, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateNotificationDto {
  @ApiPropertyOptional({
    description: 'Mark notification as read',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isRead?: boolean;
}
