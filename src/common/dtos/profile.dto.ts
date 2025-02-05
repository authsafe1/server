import { ApiProperty } from "@nestjs/swagger";
import { JsonValue } from "@prisma/client/runtime/library";
import { Transform } from "class-transformer";
import {
  IsEmail,
  IsObject,
  IsOptional,
  IsString,
  Matches,
} from "class-validator";

export class CreateProfileDto {
  @ApiProperty()
  @IsString()
  name: string;

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

export class ChangePasswordDto {
  @ApiProperty()
  @IsString()
  @Matches(/^(?=.*[A-Z])(?=.*[a-z])(?=.*[@#!$%^&])(?=.*\d).{8,}$/, {
    message:
      "Must have one lowercase, one uppercase, one digit, one special character and minimum length must be 8",
  })
  oldPassword: string;

  @ApiProperty()
  @IsString()
  @Matches(/^(?=.*[A-Z])(?=.*[a-z])(?=.*[@#!$%^&])(?=.*\d).{8,}$/, {
    message:
      "Must have one lowercase, one uppercase, one digit, one special character and minimum length must be 8",
  })
  newPassword: string;
}

export class UpdateProfileDto {
  @ApiProperty()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty()
  @IsOptional()
  @IsEmail()
  @Transform(params => params.value.toLowerCase())
  email?: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  @Matches(/^(?=.*[A-Z])(?=.*[a-z])(?=.*[@#!$%^&])(?=.*\d).{8,}$/, {
    message:
      "Must have one lowercase, one uppercase, one digit, one special character and minimum length must be 8",
  })
  password?: string;

  @ApiProperty()
  @IsOptional()
  @IsObject()
  metadata?: JsonValue;
}
