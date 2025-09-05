import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsOptional,
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

  @IsOptional()
  weight?: number;
}

export class CreateTrainingProgramDto {
  @IsEnum(DayOfWeek)
  dayOfWeek: DayOfWeek;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExerciseDto)
  exercises: ExerciseDto[];
}
