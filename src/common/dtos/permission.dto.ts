import { ApiProperty } from "@nestjs/swagger";
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
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  @Transform(({ value }) => `org:${value.toLowerCase()}`)
  @Matches(/^org:[a-z0-9_]+:[a-z0-9_]+$/, {
    message:
      'Permission key must be in the format "org:feature:permission" with lowercase letters, digits, or underscores.',
  })
  key: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  @IsOptional()
  description?: string;
}

export class UpdatePermissionDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  @IsOptional()
  description?: string;
}

export class PermissionsDto {
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
  cursor?: Prisma.PermissionWhereUniqueInput;

  @ApiProperty()
  @IsOptional()
  @IsObject()
  where?: Prisma.PermissionWhereInput;

  @ApiProperty()
  @IsOptional()
  @IsObject()
  orderBy?: Prisma.PermissionOrderByWithRelationInput;
}
