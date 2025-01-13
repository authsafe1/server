import { JsonValue } from "@prisma/client/runtime/library";
import { Transform } from "class-transformer";
import {
  IsEmail,
  IsObject,
  IsOptional,
  IsString,
  MinLength,
} from "class-validator";

export class CreateProfileDto {
  @IsString()
  name: string;

  @IsEmail()
  @Transform(params => params.value.toLowerCase())
  email: string;

  @IsString()
  @MinLength(6)
  password: string;
}

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEmail()
  @Transform(params => params.value.toLowerCase())
  email?: string;

  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;

  @IsOptional()
  @IsObject()
  metadata?: JsonValue;
}
