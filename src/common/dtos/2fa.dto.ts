import { Transform } from "class-transformer";
import { IsEmail, IsNotEmpty, IsString } from "class-validator";

export class TwoFaVerifyDto {
  @IsNotEmpty()
  @IsString()
  token: string;

  @IsNotEmpty()
  @IsEmail()
  @Transform(params => params.value.toLowerCase())
  email: string;
}

export class TwoFaBackupVerifyDto {
  @IsNotEmpty()
  @IsString()
  code: string;
}
