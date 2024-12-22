import { JsonValue } from "@prisma/client/runtime/library";
import { Transform } from "class-transformer";
import {
  IsEmail,
  IsHexColor,
  IsIn,
  IsObject,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  MinLength,
} from "class-validator";

export class CreateOrganizationDto {
  @IsString()
  name: string;

  @IsEmail()
  @Transform(params => params.value.toLowerCase())
  email: string;

  @Matches(
    /(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]/g,
    { message: "Must be a valid domain name" },
  )
  @Transform(params => params.value.toLowerCase())
  domain: string;

  @IsString()
  @MinLength(6)
  password: string;
}

export class UpdateBranding {
  @IsString()
  @IsUrl()
  @IsOptional()
  logo?: string;

  @IsString()
  @IsUrl()
  @IsOptional()
  backgroundImage?: string;

  @IsString()
  @IsOptional()
  @IsIn(["light", "dark"])
  theme?: "light" | "dark";

  @IsString()
  @IsOptional()
  header?: string;

  @IsString()
  @IsOptional()
  subHeader?: string;

  @IsString()
  @IsOptional()
  buttonText?: string;

  @IsString()
  @IsHexColor()
  @IsOptional()
  primaryColor?: string;
}

export class UpdateOrganizationDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEmail()
  @Transform(params => params.value.toLowerCase())
  email?: string;

  @IsOptional()
  @Matches(
    /(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]/g,
    { message: "Must be a valid domain name" },
  )
  @Transform(params => params.value.toLowerCase())
  domain?: string;

  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;

  @IsOptional()
  @IsObject()
  metadata?: JsonValue;
}
