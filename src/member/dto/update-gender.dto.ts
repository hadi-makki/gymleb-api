import { IsEnum, IsNotEmpty } from 'class-validator';
import { Gender } from '../entities/member.entity';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateGenderDto {
  @IsEnum(Gender)
  @IsNotEmpty()
  @ApiProperty({
    description: 'Gender of the member',
    enum: Gender,
    example: Gender.MALE,
  })
  gender: Gender;
}
