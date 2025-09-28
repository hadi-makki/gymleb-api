import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString, ArrayNotEmpty } from 'class-validator';

export class BulkDeleteTransactionsDto {
  @ApiProperty({
    description: 'Array of transaction IDs to delete',
    example: ['uuid1', 'uuid2', 'uuid3'],
    type: [String],
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  transactionIds: string[];
}
