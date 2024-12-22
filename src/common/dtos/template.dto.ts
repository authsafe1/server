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
  @IsString()
  @IsNotEmpty()
  from: string;

  @IsEmail()
  @Transform(params => params.value.toLowerCase())
  replyTo: string;

  @IsString()
  subject: string;

  @IsObject()
  body: JsonValue;
}

export class UpdateTemplateDto {
  @IsString()
  @IsOptional()
  from?: string;

  @IsEmail()
  @IsOptional()
  @Transform(params => params.value.toLowerCase())
  replyTo?: string;

  @IsString()
  @IsOptional()
  subject?: string;

  @IsObject()
  @IsOptional()
  body?: JsonValue;
}

export class TemplatesDto {
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
  cursor?: Prisma.EmailTemplateWhereUniqueInput;

  @IsOptional()
  @IsObject()
  where?: Prisma.EmailTemplateWhereInput;

  @IsOptional()
  @IsObject()
  orderBy?: Prisma.EmailTemplateOrderByWithRelationInput;
}
