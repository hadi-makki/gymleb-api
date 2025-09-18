import { IsArray, IsString, ArrayMinSize } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class NotifyManyMembersDto {
  @ApiProperty({
    description: 'Array of member IDs to send notifications to',
    example: ['member-id-1', 'member-id-2', 'member-id-3'],
    type: [String],
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'At least one member ID is required' })
  @IsString({ each: true, message: 'Each member ID must be a string' })
  memberIds: string[];
}
