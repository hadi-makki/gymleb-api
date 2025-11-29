import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsEnum,
  IsDateString,
  IsEmail,
} from 'class-validator';
import { Gender } from '../entities/member.entity';

export class UpdateMyProfileDto {
  @ApiPropertyOptional({
    description: 'Member name',
    example: 'John Doe',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    description: 'Member email',
    example: 'john.doe@example.com',
  })
  @IsOptional()
  @IsEmail()
  @IsString()
  email?: string;

  @ApiPropertyOptional({
    description: 'Member gender',
    enum: Gender,
    example: Gender.MALE,
  })
  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @ApiPropertyOptional({
    description: 'Member birthday',
    example: '1990-01-01',
  })
  @IsOptional()
  @IsDateString()
  birthday?: string;
}

