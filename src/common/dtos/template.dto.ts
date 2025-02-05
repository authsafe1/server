import { ApiProperty } from "@nestjs/swagger";
import { Prisma } from "@prisma/client";
import { JsonValue } from "@prisma/client/runtime/library";
import { Transform, Type } from "class-transformer";
import {
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  Min,
} from "class-validator";

export class CreateTemplateDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  from: string;

  @ApiProperty()
  @IsEmail()
  @Transform(params => params.value.toLowerCase())
  replyTo: string;

  @ApiProperty()
  @IsString()
  subject: string;

  @ApiProperty()
  @IsObject()
  body: JsonValue;
}

export class UpdateTemplateDto {
  @ApiProperty()
  @IsString()
  @IsOptional()
  from?: string;

  @ApiProperty()
  @IsEmail()
  @IsOptional()
  @Transform(params => params.value.toLowerCase())
  replyTo?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  subject?: string;

  @ApiProperty()
  @IsObject()
  @IsOptional()
  body?: JsonValue;
}

export class TemplatesDto {
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
  cursor?: Prisma.EmailTemplateWhereUniqueInput;

  @ApiProperty()
  @IsOptional()
  @IsObject()
  where?: Prisma.EmailTemplateWhereInput;

  @ApiProperty()
  @IsOptional()
  @IsObject()
  orderBy?: Prisma.EmailTemplateOrderByWithRelationInput;
}
