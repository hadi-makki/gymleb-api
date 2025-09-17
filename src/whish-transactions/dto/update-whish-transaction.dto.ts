import { PartialType } from '@nestjs/swagger';
import { CreateWhishDto } from './create-whish-transaction.dto';

export class UpdateWhishTransactionDto extends PartialType(CreateWhishDto) {}
