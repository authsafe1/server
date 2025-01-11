import { JsonValue } from "@prisma/client/runtime/library";
import { Transform } from "class-transformer";
import { IsObject, IsOptional, IsString, Matches } from "class-validator";

export class CreateOrganizationDto {
  @IsString()
  name: string;

  @Matches(
    /(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]/g,
    { message: "Must be a valid domain name" },
  )
  @Transform(params => params.value.toLowerCase())
  domain: string;
}

export class UpdateOrganizationDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @Matches(
    /(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]/g,
    { message: "Must be a valid domain name" },
  )
  @Transform(params => params.value.toLowerCase())
  domain?: string;

  @IsOptional()
  @IsObject()
  metadata?: JsonValue;
}
