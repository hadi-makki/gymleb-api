import { SetMetadata } from '@nestjs/common';

export const VALIDATE_REVENUE_RELATED_TO_GYM_KEY =
  'validateRevenueRelatedToGym';

/**
 * Decorator to enable revenue related to gym validation in the AuthGuard
 * When applied, the guard will check if the gymId in the request
 * belongs to the same gym as the authenticated user
 */
export const ValidateRevenueRelatedToGym = () =>
  SetMetadata(VALIDATE_REVENUE_RELATED_TO_GYM_KEY, true);
