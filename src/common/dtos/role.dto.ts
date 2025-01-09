import { Permission, Prisma } from "@prisma/client";
import { Transform, Type } from "class-transformer";
import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Min,
  ValidateNested,
} from "class-validator";

class RolePermissionDto {
  @IsString()
  @IsUUID()
  id: string;
}

export class CreateRoleDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  @Transform(({ value }) => `org:${value.toLowerCase()}`)
  @Matches(/^org:[a-z0-9_]+$/, {
    message:
      'Role key must be a single segment like "permission" with lowercase letters, digits, or underscores.',
  })
  key: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RolePermissionDto)
  permissions: Permission[];
}

export class UpdateRoleDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RolePermissionDto)
  permissions: Permission[];
}

export class RolesDto {
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
  cursor?: Prisma.RoleWhereUniqueInput;

  @IsOptional()
  @IsObject()
  where?: Prisma.RoleWhereInput;

  @IsOptional()
  @IsObject()
  orderBy?: Prisma.RoleOrderByWithRelationInput;
}
