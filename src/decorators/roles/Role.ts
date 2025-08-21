import { SetMetadata } from '@nestjs/common';
import { Permissions } from './role.enum';

export const PERMISSIONS_KEY = 'permissions';
export const Roles = (...roles: Permissions[]) =>
  SetMetadata(PERMISSIONS_KEY, [...roles, Permissions.SuperAdmin]);
