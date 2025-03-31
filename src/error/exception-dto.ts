import { ApiProperty } from '@nestjs/swagger';
import { IsDate, IsString } from 'class-validator';

export class ExceptionDto {
  @ApiProperty()
  @IsDate()
  timestamp!: Date;

  @ApiProperty()
  @IsString()
  path!: string;

  @ApiProperty()
  @IsString()
  message!: string;
}
