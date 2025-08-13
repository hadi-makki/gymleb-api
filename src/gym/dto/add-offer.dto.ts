import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsString, ValidateNested } from 'class-validator';

export class Offer {
  @IsString()
  @ApiProperty()
  description: string;
}

export class AddOfferDto {
  @ApiProperty({ type: [Offer] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => Offer)
  offers: Offer[];
}
