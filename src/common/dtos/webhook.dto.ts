import { Prisma } from "@prisma/client";
import { Type } from "class-transformer";
import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  Min,
} from "class-validator";

export class WebhookDto {
  @IsString()
  @IsUUID()
  id: string;
}

export class CreateWebhookDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsUrl()
  @IsString()
  url: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsArray()
  events: string[];
}

export class UpdateWebhookDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsUrl()
  @IsString()
  url?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  events?: string[];
}

export class WebhooksDto {
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
  cursor?: Prisma.WebhookWhereUniqueInput;

  @IsOptional()
  @IsObject()
  where?: Prisma.WebhookWhereInput;

  @IsOptional()
  @IsObject()
  orderBy?: Prisma.WebhookOrderByWithRelationInput;
}
