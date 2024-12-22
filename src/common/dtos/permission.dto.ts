import { Prisma } from "@prisma/client";
import { Transform, Type } from "class-transformer";
import {
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  Matches,
  Min,
} from "class-validator";

export class CreatePermissionDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  @Transform(({ value }) => `org:${value.toLowerCase()}`)
  @Matches(/^org:[a-z0-9_]+:[a-z0-9_]+$/, {
    message:
      'Permission key must be in the format "org:feature:permission" with lowercase letters, digits, or underscores.',
  })
  key: string;

  @IsNotEmpty()
  @IsString()
  @IsOptional()
  description?: string;
}

export class UpdatePermissionDto {
  @IsNotEmpty()
  @IsString()
  @IsOptional()
  name?: string;

  @IsNotEmpty()
  @IsString()
  @IsOptional()
  description?: string;
}

export class PermissionsDto {
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
  cursor?: Prisma.PermissionWhereUniqueInput;

  @IsOptional()
  @IsObject()
  where?: Prisma.PermissionWhereInput;

  @IsOptional()
  @IsObject()
  orderBy?: Prisma.PermissionOrderByWithRelationInput;
}
