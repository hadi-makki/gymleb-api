import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsUrl } from 'class-validator';

export class UpdateSocialMediaDto {
  @ApiProperty({
    description: 'Instagram profile URL',
    example: 'https://instagram.com/yourgym',
    required: false,
  })
  @IsOptional()
  @IsString()
  @IsUrl({}, { message: 'Instagram URL must be a valid URL' })
  instagram?: string;

  @ApiProperty({
    description: 'Facebook page URL',
    example: 'https://facebook.com/yourgym',
    required: false,
  })
  @IsOptional()
  @IsString()
  @IsUrl({}, { message: 'Facebook URL must be a valid URL' })
  facebook?: string;

  @ApiProperty({
    description: 'YouTube channel URL',
    example: 'https://youtube.com/@yourgym',
    required: false,
  })
  @IsOptional()
  @IsString()
  @IsUrl({}, { message: 'YouTube URL must be a valid URL' })
  youtube?: string;

  @ApiProperty({
    description: 'TikTok profile URL',
    example: 'https://tiktok.com/@yourgym',
    required: false,
  })
  @IsOptional()
  @IsString()
  @IsUrl({}, { message: 'TikTok URL must be a valid URL' })
  tiktok?: string;
}
