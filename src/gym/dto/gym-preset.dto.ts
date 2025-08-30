import { IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateGymPresetDto {
  @ApiProperty({ example: 'Morning Session' })
  @IsString()
  name: string;

  @ApiProperty({ example: '06:00' })
  @IsString()
  startTime: string;

  @ApiProperty({ example: '12:00' })
  @IsString()
  endTime: string;

  @ApiProperty({ required: false, example: 'Early morning workout session' })
  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateGymPresetDto {
  @ApiProperty({ required: false, example: 'Morning Session' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ required: false, example: '06:00' })
  @IsOptional()
  @IsString()
  startTime?: string;

  @ApiProperty({ required: false, example: '12:00' })
  @IsOptional()
  @IsString()
  endTime?: string;

  @ApiProperty({ required: false, example: 'Early morning workout session' })
  @IsOptional()
  @IsString()
  description?: string;
}
