import { ApiProperty } from "@nestjs/swagger";
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
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty()
  @ValidateIf(o => o.grant === "code")
  @IsNotEmpty()
  @IsUrl()
  redirectUri: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsIn(["code", "client-credentials"])
  @IsString()
  grant: string;
}

export class UpdateClientDto {
  @ApiProperty()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty()
  @IsOptional()
  @IsUrl()
  redirectUri?: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  grant?: string;
}

export class ClientsDto {
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
  cursor?: Prisma.ClientWhereUniqueInput;

  @ApiProperty()
  @IsOptional()
  @IsObject()
  where?: Prisma.ClientWhereInput;

  @ApiProperty()
  @IsOptional()
  @IsObject()
  orderBy?: Prisma.ClientOrderByWithRelationInput;
}
