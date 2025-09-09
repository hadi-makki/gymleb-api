import { SetMetadata } from '@nestjs/common';

export const VALIDATE_GYM_RELATED_TO_MANAGER_OR_MANAGER_IN_GYM_KEY = 'validateGymRelatedToManagerOrManagerInGym';

/**
 * Decorator to enable gym ownership validation in the AuthGuard
 * When applied, the guard will check if the gymId in the request
 * belongs to the same owner as the authenticated user
 */
export const ValidateGymRelatedToManagerOrManagerInGym = () =>
  SetMetadata(VALIDATE_GYM_RELATED_TO_MANAGER_OR_MANAGER_IN_GYM_KEY, true);
