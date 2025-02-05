import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsEmail, IsNotEmpty, IsString } from "class-validator";

export class TwoFaVerifyDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  token: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsEmail()
  @Transform(params => params.value.toLowerCase())
  email: string;
}

export class TwoFaBackupVerifyDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  code: string;
}
