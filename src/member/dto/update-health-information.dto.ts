import { ApiProperty } from '@nestjs/swagger';
import {
  IsOptional,
  IsNumber,
  IsString,
  IsDateString,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateHealthInformationDto {
  @ApiProperty({
    description: 'Weight in kilograms',
    example: 75.5,
    required: false,
    minimum: 20,
    maximum: 300,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(20)
  @Max(300)
  @Type(() => Number)
  weight?: number;

  @ApiProperty({
    description: 'Height in centimeters',
    example: 175.0,
    required: false,
    minimum: 100,
    maximum: 250,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(100)
  @Max(250)
  @Type(() => Number)
  height?: number;

  @ApiProperty({
    description: 'Waist width in centimeters',
    example: 85.0,
    required: false,
    minimum: 50,
    maximum: 200,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(50)
  @Max(200)
  @Type(() => Number)
  waistWidth?: number;

  @ApiProperty({
    description: 'Chest width in centimeters',
    example: 95.0,
    required: false,
    minimum: 50,
    maximum: 200,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(50)
  @Max(200)
  @Type(() => Number)
  chestWidth?: number;

  @ApiProperty({
    description: 'Arm width in centimeters',
    example: 35.0,
    required: false,
    minimum: 10,
    maximum: 100,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(10)
  @Max(100)
  @Type(() => Number)
  armWidth?: number;

  @ApiProperty({
    description: 'Thigh width in centimeters',
    example: 55.0,
    required: false,
    minimum: 20,
    maximum: 150,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(20)
  @Max(150)
  @Type(() => Number)
  thighWidth?: number;

  @ApiProperty({
    description: 'Body fat percentage',
    example: 15.5,
    required: false,
    minimum: 1,
    maximum: 50,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(1)
  @Max(50)
  @Type(() => Number)
  bodyFatPercentage?: number;

  @ApiProperty({
    description: 'Muscle mass in kilograms',
    example: 45.0,
    required: false,
    minimum: 10,
    maximum: 100,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(10)
  @Max(100)
  @Type(() => Number)
  muscleMass?: number;

  @ApiProperty({
    description: 'Body Mass Index',
    example: 24.5,
    required: false,
    minimum: 10,
    maximum: 60,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(10)
  @Max(60)
  @Type(() => Number)
  bmi?: number;

  @ApiProperty({
    description: 'Blood type',
    example: 'O+',
    required: false,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
  })
  @IsOptional()
  @IsString()
  bloodType?: string;

  @ApiProperty({
    description: 'Allergies information',
    example: 'Peanuts, Shellfish',
    required: false,
  })
  @IsOptional()
  @IsString()
  allergies?: string;

  @ApiProperty({
    description: 'Medical conditions',
    example: 'Diabetes, Hypertension',
    required: false,
  })
  @IsOptional()
  @IsString()
  medicalConditions?: string;

  @ApiProperty({
    description: 'Current medications',
    example: 'Metformin, Lisinopril',
    required: false,
  })
  @IsOptional()
  @IsString()
  medications?: string;

  @ApiProperty({
    description: 'Emergency contact name',
    example: 'John Doe',
    required: false,
  })
  @IsOptional()
  @IsString()
  emergencyContact?: string;

  @ApiProperty({
    description: 'Emergency contact phone number',
    example: '+1234567890',
    required: false,
  })
  @IsOptional()
  @IsString()
  emergencyPhone?: string;

  @ApiProperty({
    description: 'Last health check date',
    example: '2024-01-15T10:30:00Z',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  lastHealthCheck?: string;
}
