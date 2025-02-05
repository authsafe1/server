import { ApiProperty } from "@nestjs/swagger";
import { Prisma } from "@prisma/client";
import { Transform, Type } from "class-transformer";
import {
  IsArray,
  IsEmail,
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

export class CreateUserDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty()
  @IsEmail()
  @Transform(params => params.value.toLowerCase())
  email: string;

  @ApiProperty()
  @IsString()
  @Matches(/^(?=.*[A-Z])(?=.*[a-z])(?=.*[@#!$%^&])(?=.*\d).{8,}$/, {
    message:
      "Must have one lowercase, one uppercase, one digit, one special character and minimum length must be 8",
  })
  password: string;
}

export class CreateBulkUsersDto {
  @ApiProperty()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateUserDto)
  data: CreateUserDto[];
}

export class InviteUserDto {
  @ApiProperty()
  @IsEmail()
  @Transform(params => params.value.toLowerCase())
  email: string;
}

export class VerifyUserDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty()
  @IsString()
  @Matches(/^(?=.*[A-Z])(?=.*[a-z])(?=.*[@#!$%^&])(?=.*\d).{8,}$/, {
    message:
      "Must have one lowercase, one uppercase, one digit, one special character and minimum length must be 8",
  })
  password: string;
}

export class UpdateUserDto {
  @ApiProperty()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty()
  @IsOptional()
  @IsEmail()
  @Transform(params => params.value.toLowerCase())
  email?: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  @Matches(/^(?=.*[A-Z])(?=.*[a-z])(?=.*[@#!$%^&])(?=.*\d).{8,}$/, {
    message:
      "Must have one lowercase, one uppercase, one digit, one special character and minimum length must be 8",
  })
  password?: string;
}

export class AssignRoleDto {
  @ApiProperty()
  @IsString()
  @IsUUID()
  roleId: string;
}

export class UsersDto {
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
  cursor?: Prisma.UserWhereUniqueInput;

  @ApiProperty()
  @IsOptional()
  @IsObject()
  where?: Prisma.UserWhereInput;

  @ApiProperty()
  @IsOptional()
  @IsObject()
  orderBy?: Prisma.UserOrderByWithRelationInput;
}
