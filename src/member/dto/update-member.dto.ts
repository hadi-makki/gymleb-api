import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { CreateMemberDto } from './create-member.dto';
import { IsOptional, IsString } from 'class-validator';

export class UpdateMemberDto extends PartialType(CreateMemberDto) {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phoneNumberISOCode?: string;
}
