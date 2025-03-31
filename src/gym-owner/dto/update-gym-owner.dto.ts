import { PartialType } from '@nestjs/swagger';
import { CreateGymOwnerDto } from './create-gym-owner.dto';

export class UpdateGymOwnerDto extends PartialType(CreateGymOwnerDto) {}
