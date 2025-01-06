import { Prisma } from "@prisma/client";
import { Type } from "class-transformer";
import {
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  Min,
} from "class-validator";

export class CreateApiKeyDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsDateString()
  expiresAt: Date;
}

export class ApiKeysDto {
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
  cursor?: Prisma.ApiKeyWhereUniqueInput;

  @IsOptional()
  @IsObject()
  where?: Prisma.ApiKeyWhereInput;

  @IsOptional()
  @IsObject()
  orderBy?: Prisma.ApiKeyOrderByWithRelationInput;
}
