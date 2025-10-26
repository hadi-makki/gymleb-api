import { PartialType } from '@nestjs/swagger';
import { CreatePersonalTrainerDto } from './create-personal-trainer.dto';

export class UpdatePersonalTrainerDto extends PartialType(
  CreatePersonalTrainerDto,
) {
  // workingDays is already included from CreatePersonalTrainerDto via PartialType
}
