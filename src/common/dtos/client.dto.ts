import { Prisma } from "@prisma/client";
import { Type } from "class-transformer";
import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  IsUrl,
  Min,
  ValidateIf,
} from "class-validator";

export class CreateClientDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @ValidateIf(o => o.grant === "code")
  @IsNotEmpty()
  @IsUrl()
  redirectUri: string;

  @IsNotEmpty()
  @IsIn(["code", "client-credentials"])
  @IsString()
  grant: string;
}

export class UpdateClientDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsUrl()
  redirectUri?: string;

  @IsOptional()
  @IsString()
  grant?: string;
}

export class ClientsDto {
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
