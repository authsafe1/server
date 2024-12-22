import { Prisma } from "@prisma/client";
import { Type } from "class-transformer";
import { IsInt, IsObject, IsOptional, Min } from "class-validator";

export class AuthorizationLogDto {
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
  cursor?: Prisma.AuthorizationLogWhereUniqueInput;

  @IsOptional()
  @IsObject()
  where?: Prisma.AuthorizationLogWhereInput;

  @IsOptional()
  @IsObject()
  orderBy?: Prisma.AuthorizationLogOrderByWithRelationInput;
}

export class SecurityAlertDto {
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
  cursor?: Prisma.SecurityAlertWhereUniqueInput;

  @IsOptional()
  @IsObject()
  where?: Prisma.SecurityAlertWhereInput;

  @IsOptional()
  @IsObject()
  orderBy?: Prisma.SecurityAlertOrderByWithRelationInput;
}

export class ActivityLogDto {
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
  cursor?: Prisma.ActivityLogWhereUniqueInput;

  @IsOptional()
  @IsObject()
  where?: Prisma.ActivityLogWhereInput;

  @IsOptional()
  @IsObject()
  orderBy?: Prisma.ActivityLogOrderByWithRelationInput;
}
