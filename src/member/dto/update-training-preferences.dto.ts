import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import {
  TrainingLevel,
  TrainingGoals,
  TrainingPreferences,
} from '../entities/member.entity';

export class UpdateTrainingPreferencesDto {
  @ApiProperty({
    description: 'Training level of the member',
    enum: TrainingLevel,
    required: false,
    example: TrainingLevel.INTERMEDIATE,
  })
  @IsOptional()
  @IsEnum(TrainingLevel)
  trainingLevel?: TrainingLevel;

  @ApiProperty({
    description: 'Training goals of the member',
    enum: TrainingGoals,
    required: false,
    example: TrainingGoals.BUILD_MUSCLE,
  })
  @IsOptional()
  @IsEnum(TrainingGoals)
  trainingGoals?: TrainingGoals;

  @ApiProperty({
    description: 'Training preferences of the member',
    enum: TrainingPreferences,
    required: false,
    example: TrainingPreferences.GYM,
  })
  @IsOptional()
  @IsEnum(TrainingPreferences)
  trainingPreferences?: TrainingPreferences;
}
