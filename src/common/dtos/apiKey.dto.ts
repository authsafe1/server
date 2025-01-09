import { Prisma } from "@prisma/client";
import { Type } from "class-transformer";
import {
  IsDate,
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  Min,
  MinDate,
} from "class-validator";

export class CreateApiKeyDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsDate()
  @MinDate(new Date(), {
    message: "Expiry date must be not be in the past",
  })
  expiresAt: Date;
}

export class UpdateApiKeyDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsDate()
  @MinDate(new Date(), {
    message: "Expiry date must be not be in the past",
  })
  @IsOptional()
  expiresAt?: Date;
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
