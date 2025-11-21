import { PartialType } from '@nestjs/swagger';
import { CreatePersonalScheduleDto } from './create-personal-schedule.dto';

export class UpdatePersonalScheduleDto extends PartialType(CreatePersonalScheduleDto) {}
