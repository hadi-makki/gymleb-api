import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CreateFileDto {
  @ApiProperty({ type: 'string', format: 'binary' })
  @IsString()
  file: string;
}
