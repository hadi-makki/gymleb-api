import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty } from 'class-validator';

export class UpdateAllowMembersSetPtTimesDto {
  @ApiProperty({
    description: 'Allow members to set PT session times',
    example: true,
  })
  @IsNotEmpty()
  @IsBoolean()
  allowMembersSetPtTimes: boolean;
}
