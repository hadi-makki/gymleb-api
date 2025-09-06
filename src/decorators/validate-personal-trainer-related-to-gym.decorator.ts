import { SetMetadata } from '@nestjs/common';

export const VALIDATE_PERSONAL_TRAINER_RELATED_TO_GYM_KEY =
  'validatePersonalTrainerRelatedToGym';

/**
 * Decorator to enable personal trainer gym validation in the AuthGuard
 * When applied, the guard will check if the personalTrainerId in the request
 * belongs to the same gym as specified in gymId
 */
export const ValidatePersonalTrainerRelatedToGym = () =>
  SetMetadata(VALIDATE_PERSONAL_TRAINER_RELATED_TO_GYM_KEY, true);
