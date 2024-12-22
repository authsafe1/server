import { Prisma, Role } from "@prisma/client";
import { Transform, Type } from "class-transformer";
import {
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from "class-validator";

export class AdminUsersDto {
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
  cursor?: Prisma.UserWhereUniqueInput;

  @IsOptional()
  @IsObject()
  where?: Prisma.UserWhereInput;

  @IsOptional()
  @IsObject()
  orderBy?: Prisma.UserOrderByWithRelationInput;
}

export class AdminCreateUserDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  @Transform(params => params.value.toLowerCase())
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsOptional()
  @IsString()
  role?: Role;
}

export class AdminUpdateUserDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;

  @IsOptional()
  @IsString()
  role?: Role;
}

export class AdminClientsDto {
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
  cursor?: Prisma.ClientWhereUniqueInput;

  @IsOptional()
  @IsObject()
  where?: Prisma.ClientWhereInput;

  @IsOptional()
  @IsObject()
  orderBy?: Prisma.ClientOrderByWithRelationInput;
}
