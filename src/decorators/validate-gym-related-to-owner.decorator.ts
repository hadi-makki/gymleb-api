import { SetMetadata } from '@nestjs/common';

export const VALIDATE_GYM_RELATED_TO_OWNER_KEY = 'validateGymRelatedToOwner';

/**
 * Decorator to enable gym ownership validation in the AuthGuard
 * When applied, the guard will check if the gymId in the request
 * belongs to the same owner as the authenticated user
 */
export const ValidateGymRelatedToOwner = () =>
  SetMetadata(VALIDATE_GYM_RELATED_TO_OWNER_KEY, true);
