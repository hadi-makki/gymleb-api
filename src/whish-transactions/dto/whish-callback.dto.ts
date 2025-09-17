import { IsString, IsOptional } from 'class-validator';

export class WhishCallbackDto {
  // the spec doesn't strictly define the callback body beyond success/failure,
  // but typical payloads include externalId and collectStatus. Accept extras.
  @IsOptional()
  @IsString()
  externalId?: string;

  @IsOptional()
  @IsString()
  collectStatus?: 'success' | 'failed' | 'pending' | string;

  @IsOptional()
  data?: any;
}
