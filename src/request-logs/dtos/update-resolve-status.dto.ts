import { IsEnum, IsUUID } from 'class-validator';
import { ResolveStatus } from '../request-log.entity';

export class UpdateResolveStatusDto {
  @IsEnum(ResolveStatus)
  resolveStatus: ResolveStatus;
}
