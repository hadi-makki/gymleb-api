import { IsString } from 'class-validator';

export class UpdateGymNoteDto {
  @IsString()
  note: string;
}
