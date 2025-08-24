import { IsBoolean, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class DeleteMemberDto {
  @ApiProperty({
    description: 'Whether to delete all related transactions for this member',
    required: false,
    default: false,
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  deleteTransactions?: boolean;
}
