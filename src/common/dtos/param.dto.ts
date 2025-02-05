import { ApiProperty } from "@nestjs/swagger";
import { IsUUID } from "class-validator";

export class ParamDto {
  @ApiProperty()
  @IsUUID()
  id: string;
}
