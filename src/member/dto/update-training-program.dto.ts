import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { DayOfWeek } from '../entities/member-attending-days.entity';

export class ExerciseDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNotEmpty()
  sets: number;

  @IsNotEmpty()
  reps: number;

  weight?: number;
}

export class UpdateTrainingProgramDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExerciseDto)
  exercises: ExerciseDto[];
}
