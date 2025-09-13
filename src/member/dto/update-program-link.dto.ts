import { IsOptional, IsString, IsUrl } from 'class-validator';

export class UpdateProgramLinkDto {
  @IsOptional()
  @IsString()
  @IsUrl({}, { message: 'Please provide a valid URL' })
  programLink?: string;
}
