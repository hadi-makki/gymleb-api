import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class UpdateAllowUserSignupDto {
  @ApiProperty({
    description: 'Whether to allow user signup',
    example: true,
  })
  @IsBoolean()
  allowUserSignUp: boolean;
}
