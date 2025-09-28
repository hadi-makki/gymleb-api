import { IsInt, Min } from 'class-validator';

export class IncreaseReservationsDto {
  @IsInt()
  @Min(1)
  amount: number;
}
