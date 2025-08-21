import { ApiProperty } from '@nestjs/swagger';

export class ManagerCreatedDto {
  @ApiProperty()
  _id?: any;

  @ApiProperty()
  id: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  username: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
