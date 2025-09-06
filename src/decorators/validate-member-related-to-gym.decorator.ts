import { SetMetadata } from '@nestjs/common';

export const VALIDATE_MEMBER_RELATED_TO_GYM_KEY = 'validateMemberRelatedToGym';

/**
 * Decorator to enable gym ownership validation in the AuthGuard
 * When applied, the guard will check if the gymId in the request
 * belongs to the same gym as the authenticated user
 */
export const ValidateMemberRelatedToGym = () =>
  SetMetadata(VALIDATE_MEMBER_RELATED_TO_GYM_KEY, true);
