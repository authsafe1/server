import { Prisma } from "@prisma/client";
import { JsonValue } from "@prisma/client/runtime/library";
import { Transform, Type } from "class-transformer";
import {
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  Matches,
  Min,
} from "class-validator";

export class OrganizationsDto {
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  skip?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  take?: number;

  @IsOptional()
  @IsObject()
  cursor?: Prisma.OrganizationWhereUniqueInput;

  @IsOptional()
  @IsObject()
  where?: Prisma.OrganizationWhereInput;

  @IsOptional()
  @IsObject()
  orderBy?: Prisma.OrganizationOrderByWithRelationInput;
}

export class CreateOrganizationDto {
  @IsString()
  name: string;

  @IsString()
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
