import { ApiProperty } from '@nestjs/swagger';

export class MainDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty()
  isDeactivated: boolean;
}
