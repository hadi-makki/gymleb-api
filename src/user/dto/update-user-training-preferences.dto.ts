import { IsEnum, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import {
  TrainingLevel,
  TrainingGoals,
  TrainingPreferences,
} from 'src/member/entities/member.entity';

export class UpdateUserTrainingPreferencesDto {
  @ApiProperty({
    description: 'Training level of the user',
    enum: TrainingLevel,
    required: false,
    example: TrainingLevel.INTERMEDIATE,
  })
  @IsOptional()
  @IsEnum(TrainingLevel)
  trainingLevel?: TrainingLevel;

  @ApiProperty({
    description: 'Training goals of the user',
    enum: TrainingGoals,
    required: false,
    example: TrainingGoals.BUILD_MUSCLE,
  })
  @IsOptional()
  @IsEnum(TrainingGoals)
  trainingGoals?: TrainingGoals;

  @ApiProperty({
    description: 'Training preferences of the user',
    enum: TrainingPreferences,
    required: false,
    example: TrainingPreferences.GYM,
  })
  @IsOptional()
  @IsEnum(TrainingPreferences)
  trainingPreferences?: TrainingPreferences;
}
