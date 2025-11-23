import { ApiProperty } from '@nestjs/swagger';

export class PermissionOptionDto {
  @ApiProperty({
    description: 'The title of the permission',
    example: 'Read Members',
  })
  title: string;

  @ApiProperty({
    description: 'The value of the permission',
    example: 'read:members',
  })
  value: string;
}

export class EntityPermissionsDto {
  @ApiProperty({
    description: 'The name of the entity',
    example: 'members',
  })
  entityName: string;

  @ApiProperty({
    description: 'List of permissions for this entity',
    type: [PermissionOptionDto],
  })
  permissions: PermissionOptionDto[];
}

