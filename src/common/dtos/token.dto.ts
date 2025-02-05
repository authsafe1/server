import { ApiProperty } from "@nestjs/swagger";
import { Prisma } from "@prisma/client";
import { Type } from "class-transformer";
import { IsInt, IsObject, IsOptional, Min } from "class-validator";

export class TokensDto {
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
  cursor?: Prisma.RefreshTokenWhereUniqueInput;

  @ApiProperty()
  @IsOptional()
  @IsObject()
  where?: Prisma.RefreshTokenWhereInput;

  @ApiProperty()
  @IsOptional()
  @IsObject()
  orderBy?: Prisma.RefreshTokenOrderByWithRelationInput;
}
