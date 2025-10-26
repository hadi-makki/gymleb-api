import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty, IsString } from 'class-validator';

export class UpdateSessionDateDto {
  @ApiProperty({
    description: 'The ID of the session to update',
    example: '6621b0a9b547942bc1111111',
  })
  @IsNotEmpty()
  @IsString()
  sessionId: string;

  @ApiProperty({
    description: 'The new date and time for the session (ISO string)',
    example: '2025-01-01T10:00:00.000Z',
  })
  @IsNotEmpty()
  @IsDateString()
  date: string;
}
