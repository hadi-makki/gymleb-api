import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsString } from "class-validator";

export enum CallWith {
  KWAY = "Kway",
  TITI = "TiTi",
}

export class CreatePaymentIntentDto {
  @IsString()
  @ApiProperty()
  fullName: string;

  @IsString()
  @ApiProperty()
  phoneNumber: string;

  @IsString()
  @ApiProperty()
  topic: string;

  @IsString()
  @ApiProperty()
  product: string;

  @IsString()
  @ApiProperty()
  callDescription: string;

  @IsString()
  @ApiProperty()
  email: string;

  @ApiProperty()
  @IsEnum(CallWith)
  callWith: CallWith;
}
