import { ApiProperty } from '@nestjs/swagger';
import { IsArray, ValidateNested, IsString, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';

export class WomensTimeDto {
  @ApiProperty({
    description: 'Day of the week',
    example: 'Monday',
  })
  @IsString()
  @IsNotEmpty()
  day: string;

  @ApiProperty({
    description: 'Start time',
    example: '09:00',
  })
  @IsString()
  @IsNotEmpty()
  from: string;

  @ApiProperty({
    description: 'End time',
    example: '12:00',
  })
  @IsString()
  @IsNotEmpty()
  to: string;
}

export class UpdateWomensTimesDto {
  @ApiProperty({
    description: 'Array of women-only time slots',
    type: [WomensTimeDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WomensTimeDto)
  womensTimes: WomensTimeDto[];
}
