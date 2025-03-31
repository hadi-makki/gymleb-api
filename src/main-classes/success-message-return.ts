import { ApiProperty } from '@nestjs/swagger';

export class SuccessMessageReturn {
  @ApiProperty()
  message: string;
}
