import { Prisma } from "@prisma/client";
import { Transform, Type } from "class-transformer";
import {
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Min,
} from "class-validator";

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEmail()
  @Transform(params => params.value.toLowerCase())
  email: string;

  @IsString()
  @Matches(/^(?=.*[A-Z])(?=.*[a-z])(?=.*[@#!$%^&])(?=.*\d).{8,}$/, {
    message:
      "Must have one lowercase, one uppercase, one digit, one special character and minimum length must be 8",
  })
  password: string;
}

export class InviteUserDto {
  @IsEmail()
  @Transform(params => params.value.toLowerCase())
  email: string;
}

export class VerifyUserDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @Matches(/^(?=.*[A-Z])(?=.*[a-z])(?=.*[@#!$%^&])(?=.*\d).{8,}$/, {
    message:
      "Must have one lowercase, one uppercase, one digit, one special character and minimum length must be 8",
  })
  password: string;
}

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEmail()
  @Transform(params => params.value.toLowerCase())
  email?: string;

  @IsOptional()
  @IsString()
  @Matches(/^(?=.*[A-Z])(?=.*[a-z])(?=.*[@#!$%^&])(?=.*\d).{8,}$/, {
    message:
      "Must have one lowercase, one uppercase, one digit, one special character and minimum length must be 8",
  })
  password?: string;
}

export class AssignRoleDto {
  @IsString()
  @IsUUID()
  roleId: string;
}

export class UsersDto {
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
