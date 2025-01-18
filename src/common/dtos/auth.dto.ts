import { Transform } from "class-transformer";
import { IsEmail, IsNotEmpty, IsString, Matches } from "class-validator";

export class LoginDto {
  @IsEmail()
  @Transform(params => params.value.toLowerCase())
  email: string;

  @IsString()
  @Matches(/^(?=.*[A-Z])(?=.*[a-z])(?=.*[@#!$%^&])(?=.*\d).{8,}$/, {
    message:
      "Must have one lowercase, one uppercase, one digit, one special character and minimum length must be 8",
  })
  password: string;
}

export class ForgotPasswordDto {
  @IsEmail()
  email: string;
}

export class ResetPasswordDto {
  @IsString()
  @IsNotEmpty()
  token: string;

  @IsString()
  @Matches(/^(?=.*[A-Z])(?=.*[a-z])(?=.*[@#!$%^&])(?=.*\d).{8,}$/, {
    message:
      "Must have one lowercase, one uppercase, one digit, one special character and minimum length must be 8",
  })
  password: string;
}
