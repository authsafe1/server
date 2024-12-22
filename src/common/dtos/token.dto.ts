import { Prisma } from "@prisma/client";
import { Type } from "class-transformer";
import { IsInt, IsObject, IsOptional, Min } from "class-validator";

export class TokensDto {
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
  cursor?: Prisma.RefreshTokenWhereUniqueInput;

  @IsOptional()
  @IsObject()
  where?: Prisma.RefreshTokenWhereInput;

  @IsOptional()
  @IsObject()
  orderBy?: Prisma.RefreshTokenOrderByWithRelationInput;
}
