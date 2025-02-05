import { ApiProperty } from "@nestjs/swagger";
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
  @ApiProperty()
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  skip?: number;

  @ApiProperty()
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  take?: number;

  @ApiProperty()
  @IsOptional()
  @IsObject()
  cursor?: Prisma.OrganizationWhereUniqueInput;

  @ApiProperty()
  @IsOptional()
  @IsObject()
  where?: Prisma.OrganizationWhereInput;

  @ApiProperty()
  @IsOptional()
  @IsObject()
  orderBy?: Prisma.OrganizationOrderByWithRelationInput;
}

export class CreateOrganizationDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsString()
  @Matches(
    /(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]/g,
    { message: "Must be a valid domain name" },
  )
  @Transform(params => params.value.toLowerCase())
  domain: string;
}

export class UpdateOrganizationDto {
  @ApiProperty()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty()
  @IsOptional()
  @Matches(
    /(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]/g,
    { message: "Must be a valid domain name" },
  )
  @Transform(params => params.value.toLowerCase())
  domain?: string;

  @ApiProperty()
  @IsOptional()
  @IsObject()
  metadata?: JsonValue;
}
