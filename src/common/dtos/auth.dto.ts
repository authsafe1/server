import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsEmail, IsNotEmpty, IsString, Matches } from "class-validator";

export class LoginDto {
  @ApiProperty()
  @IsEmail()
  @Transform(params => params.value.toLowerCase())
  email: string;

  @ApiProperty()
  @IsString()
  @Matches(/^(?=.*[A-Z])(?=.*[a-z])(?=.*[@#!$%^&])(?=.*\d).{8,}$/, {
    message:
      "Must have one lowercase, one uppercase, one digit, one special character and minimum length must be 8",
  })
  password: string;
}

export class ForgotPasswordDto {
  @ApiProperty()
  @IsEmail()
  email: string;
}

export class ResetPasswordDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  token: string;

  @ApiProperty()
  @IsString()
  @Matches(/^(?=.*[A-Z])(?=.*[a-z])(?=.*[@#!$%^&])(?=.*\d).{8,}$/, {
    message:
      "Must have one lowercase, one uppercase, one digit, one special character and minimum length must be 8",
  })
  password: string;
}
